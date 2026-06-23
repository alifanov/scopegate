import { z } from 'zod';
import { trace } from '@opentelemetry/api';
import { threadsFetch } from '../threads';
import type { ToolDefinition } from './types';

// Meta processes media containers asynchronously: the create call returns a container id
// immediately, but the container is not publishable until its status becomes FINISHED.
// Publishing before then is what made the publish step hang and time out. So for media we
// poll the container status until it is ready, then publish — all inside the handler's 30s cap.
// Total budget is 8s to keep p99 < 8s. Retries are disabled on each step: serviceFetch retries
// (delaysMs: [250, 500]) multiplied the effective per-step timeout by 3x and blew the budget.
// The poll loop is already its own retry mechanism; the container/publish steps fail fast instead.
const THREADS_PUBLISH_TOTAL_BUDGET_MS = 8_000;
const THREADS_TEXT_CONTAINER_TIMEOUT_MS = 4_500;
const THREADS_MEDIA_CONTAINER_TIMEOUT_MS = 4_500;
const THREADS_PUBLISH_TIMEOUT_MS = 3_500;
const THREADS_STATUS_POLL_TIMEOUT_MS = 2_500;
const THREADS_STATUS_POLL_INTERVAL_MS = 1_000;

const THREADS_MAX_TEXT_LENGTH = 500;

function hasPublishMedia(params: Record<string, unknown>) {
  return params.media_type === "IMAGE" || params.media_type === "VIDEO";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ThreadsContainerStatus = {
  status?: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
  error_message?: string;
};

// Polls a media container until Meta finishes processing it. Returns true once the
// container reaches FINISHED, false if the deadline passes while still in progress
// (the caller then returns partial_success). Throws if Meta reports ERROR/EXPIRED.
async function waitForContainerReady(
  serviceConnectionId: string,
  creationId: string,
  deadline: number
): Promise<boolean> {
  while (Date.now() < deadline) {
    const result = (await threadsFetch(
      serviceConnectionId,
      `/${creationId}?fields=status,error_message`,
      { timeout: THREADS_STATUS_POLL_TIMEOUT_MS, retry: false }
    )) as ThreadsContainerStatus;

    if (result.status === "FINISHED") return true;
    if (result.status === "ERROR" || result.status === "EXPIRED") {
      throw new Error(
        `Threads media processing ${result.status.toLowerCase()}: ${result.error_message ?? "unknown error"}`
      );
    }
    if (Date.now() + THREADS_STATUS_POLL_INTERVAL_MS >= deadline) break;
    await sleep(THREADS_STATUS_POLL_INTERVAL_MS);
  }
  return false;
}

export const threadsTools: ToolDefinition[] = [
  // ─── Threads tools ────────────────────────────────────────────────────
  {
    name: "threads_get_profile",
    description: "Get the authenticated Threads user's profile",
    action: "threads:get_profile",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        "/me?fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified"
      );
    },
  },
  {
    name: "threads_get_threads",
    description: "Get the authenticated user's threads",
    action: "threads:get_threads",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of threads to return (default 25)"),
      after: z.string().optional().describe("Pagination cursor"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,media_url,shortcode,has_replies,is_reply,reply_audience,topic_tag";
      let path = `/me/threads?fields=${fields}&limit=${params.limit ?? 25}`;
      if (params.after) path += `&after=${params.after}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_thread",
    description: "Get a specific thread by ID",
    action: "threads:get_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,media_url,shortcode,has_replies,is_reply,root_post,replied_to,reply_audience,topic_tag,link_attachment_url";
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}?fields=${fields}`);
    },
  },
  {
    name: "threads_publish_thread",
    description: "Create and publish a thread. For text posts, set media_type to TEXT. For images, set to IMAGE with image_url. For videos, set to VIDEO with video_url.",
    action: "threads:publish_thread",
    inputSchema: z.object({
      text: z.string().max(THREADS_MAX_TEXT_LENGTH).optional().describe("Post text (max 500 characters)"),
      media_type: z.enum(["TEXT", "IMAGE", "VIDEO"]).describe("Type of media"),
      image_url: z.string().optional().describe("Public URL of the image (for IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (for VIDEO type)"),
      reply_control: z.enum(["everyone", "accounts_you_follow", "mentioned_only"]).optional().describe("Who can reply"),
      link_attachment: z.string().optional().describe("URL to attach (TEXT posts only)"),
      quote_post_id: z.string().optional().describe("ID of post to quote"),
    }),
    handler: async (params, context) => {
      const deadline = Date.now() + THREADS_PUBLISH_TOTAL_BUDGET_MS;
      const isMedia = hasPublishMedia(params);
      const span = trace.getActiveSpan();
      span?.setAttribute("threads.media_type", params.media_type as string);

      // Step 1: Create media container
      span?.setAttribute("threads.step", "create_container");
      const body: Record<string, string> = {
        media_type: params.media_type as string,
      };
      if (params.text) body.text = params.text as string;
      if (params.image_url) body.image_url = params.image_url as string;
      if (params.video_url) body.video_url = params.video_url as string;
      if (params.reply_control) body.reply_control = params.reply_control as string;
      if (params.link_attachment) body.link_attachment = params.link_attachment as string;
      if (params.quote_post_id) body.quote_post_id = params.quote_post_id as string;

      // ponytail: containerTimeout caps against remaining budget so container+publish ≤ total budget
      const containerTimeout = Math.min(
        isMedia ? THREADS_MEDIA_CONTAINER_TIMEOUT_MS : THREADS_TEXT_CONTAINER_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now() - THREADS_PUBLISH_TIMEOUT_MS)
      );
      const containerResult = (await threadsFetch(
        context.serviceConnectionId,
        "/me/threads",
        {
          method: "POST",
          body: JSON.stringify(body),
          timeout: containerTimeout,
          retry: false,
        }
      )) as { id: string };

      span?.setAttribute("threads.container_id", containerResult.id);

      // Step 2: wait for the container to reach FINISHED before publishing. Publishing an
      // unfinished container makes Meta hold the publish request until it times out — this
      // affects text posts too, not just media, so we always poll.
      // Reserve THREADS_PUBLISH_TIMEOUT_MS from the deadline for the publish step.
      span?.setAttribute("threads.step", "wait_container");
      const pollDeadline = deadline - THREADS_PUBLISH_TIMEOUT_MS;
      const ready = await waitForContainerReady(
        context.serviceConnectionId,
        containerResult.id,
        pollDeadline
      );
      if (!ready) {
        return {
          status: "partial_success",
          creation_id: containerResult.id,
          message:
            "Threads container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
        };
      }

      // Step 3: Publish — cap timeout against remaining budget so total never exceeds 8s
      span?.setAttribute("threads.step", "publish");
      const publishTimeout = Math.min(
        THREADS_PUBLISH_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now())
      );
      const publishResult = await threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publish",
        {
          method: "POST",
          body: JSON.stringify({ creation_id: containerResult.id }),
          timeout: publishTimeout,
          retry: false,
        }
      );

      return publishResult;
    },
  },
  {
    name: "threads_delete_thread",
    description: "Delete a thread by ID",
    action: "threads:delete_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID to delete"),
    }),
    handler: async (params, context) => {
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "threads_get_replies",
    description: "Get top-level replies to a thread",
    action: "threads:get_replies",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
      reverse: z.boolean().optional().describe("Reverse chronological order (default true)"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,has_replies";
      let path = `/${params.threadId}/replies?fields=${fields}`;
      if (params.reverse !== undefined) path += `&reverse=${params.reverse}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_conversation",
    description: "Get all replies at any depth for a thread (flattened)",
    action: "threads:get_conversation",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
      reverse: z.boolean().optional().describe("Reverse chronological order (default true)"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,has_replies";
      let path = `/${params.threadId}/conversation?fields=${fields}`;
      if (params.reverse !== undefined) path += `&reverse=${params.reverse}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_reply_to_thread",
    description: "Reply to a specific thread",
    action: "threads:reply_to_thread",
    inputSchema: z.object({
      reply_to_id: z.string().describe("The thread media ID to reply to"),
      text: z.string().max(THREADS_MAX_TEXT_LENGTH).optional().describe("Reply text (max 500 characters)"),
      media_type: z.enum(["TEXT", "IMAGE", "VIDEO"]).describe("Type of media"),
      image_url: z.string().optional().describe("Public URL of the image (for IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (for VIDEO type)"),
    }),
    handler: async (params, context) => {
      const deadline = Date.now() + THREADS_PUBLISH_TOTAL_BUDGET_MS;
      const isMedia = hasPublishMedia(params);

      // Step 1: Create reply container
      const body: Record<string, string> = {
        media_type: params.media_type as string,
        reply_to_id: params.reply_to_id as string,
      };
      if (params.text) body.text = params.text as string;
      if (params.image_url) body.image_url = params.image_url as string;
      if (params.video_url) body.video_url = params.video_url as string;

      const containerTimeout = Math.min(
        isMedia ? THREADS_MEDIA_CONTAINER_TIMEOUT_MS : THREADS_TEXT_CONTAINER_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now() - THREADS_PUBLISH_TIMEOUT_MS)
      );
      const containerResult = (await threadsFetch(
        context.serviceConnectionId,
        "/me/threads",
        {
          method: "POST",
          body: JSON.stringify(body),
          timeout: containerTimeout,
          retry: false,
        }
      )) as { id: string };

      // Step 2: Wait for container to be ready before publishing (same hang risk as threads_publish_thread)
      const pollDeadline = deadline - THREADS_PUBLISH_TIMEOUT_MS;
      const ready = await waitForContainerReady(
        context.serviceConnectionId,
        containerResult.id,
        pollDeadline
      );
      if (!ready) {
        return {
          status: "partial_success",
          creation_id: containerResult.id,
          message:
            "Reply container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
        };
      }

      // Step 3: Publish reply — cap timeout against remaining budget
      const publishTimeout = Math.min(
        THREADS_PUBLISH_TIMEOUT_MS,
        Math.max(1_000, deadline - Date.now())
      );
      return threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publish",
        {
          method: "POST",
          body: JSON.stringify({ creation_id: containerResult.id }),
          timeout: publishTimeout,
          retry: false,
        }
      );
    },
  },
  {
    name: "threads_repost_thread",
    description: "Repost a thread",
    action: "threads:repost_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID to repost"),
    }),
    handler: async (params, context) => {
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}/repost`, {
        method: "POST",
      });
    },
  },
  {
    name: "threads_get_thread_insights",
    description: "Get insights (views, likes, replies, reposts, quotes, shares) for a specific thread",
    action: "threads:get_thread_insights",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
    }),
    handler: async (params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        `/${params.threadId}/insights?metric=views,likes,replies,reposts,quotes,shares`
      );
    },
  },
  {
    name: "threads_get_user_insights",
    description: "Get user-level insights (views, likes, replies, reposts, quotes, followers_count)",
    action: "threads:get_user_insights",
    inputSchema: z.object({
      metric: z.enum(["views", "likes", "replies", "reposts", "quotes", "followers_count"]).describe("Metric to retrieve"),
      since: z.number().optional().describe("Start timestamp (Unix seconds)"),
      until: z.number().optional().describe("End timestamp (Unix seconds)"),
    }),
    handler: async (params, context) => {
      let path = `/me/threads_insights?metric=${params.metric}`;
      if (params.since) path += `&since=${params.since}`;
      if (params.until) path += `&until=${params.until}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_publishing_limit",
    description: "Check the current publishing quota usage",
    action: "threads:get_publishing_limit",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publishing_limit?fields=quota_usage,config"
      );
    },
  },
  {
    name: "threads_lookup_profile",
    description: "Look up a public Threads profile by username",
    action: "threads:lookup_profile",
    inputSchema: z.object({
      username: z.string().describe("The Threads username to look up"),
    }),
    handler: async (params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        `/profile_lookup?username=${encodeURIComponent(params.username as string)}&fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified,follower_count`
      );
    },
  },

];
