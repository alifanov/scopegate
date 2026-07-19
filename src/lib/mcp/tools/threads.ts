import { z } from 'zod';
import { trace } from '@opentelemetry/api';
import { threadsFetch, ThreadsApiError } from '../threads';
import { OAuthTokenError } from '@/lib/oauth-token-lifecycle';
import { recordThreadsPublishOutcome } from '../metrics';
import type { ToolDefinition } from './types';
import {
  classifyContainerStatus,
  computeStepTimeout,
  shouldStopPolling,
  sleep,
  waitForContainerReady as pollUntilContainerReady,
} from './container-poll';

// Meta processes media containers asynchronously: the create call returns a container id
// immediately, but the container is not publishable until its status becomes FINISHED.
// Publishing before then is what made the publish step hang and time out. So for media we
// poll the container status until it is ready, then publish — all inside the handler's 30s cap.
// Retries are disabled on each step: serviceFetch retries (delaysMs: [250, 500]) multiplied
// the effective per-step timeout by 3x and blew the budget. The poll loop is already its own
// retry mechanism; the container/publish steps fail fast instead.
//
// TEXT and IMAGE/VIDEO get separate budgets. For a text container Meta has nothing to fetch,
// so an 8s budget keeps p99 low. For media, creating the container makes Meta SYNCHRONOUSLY
// download the file from image_url/video_url before returning the id — that alone routinely
// exceeds 4.5s (observed: 57% of image posts timed out at create_container with a 4.5s cap).
// So media gets a much larger budget, bounded only by the handler's 30s cap.
const THREADS_TEXT_TOTAL_BUDGET_MS = 8_000;
const THREADS_MEDIA_TOTAL_BUDGET_MS = 24_000;
const THREADS_TEXT_CONTAINER_TIMEOUT_MS = 4_500;
const THREADS_MEDIA_CONTAINER_TIMEOUT_MS = 18_000;
const THREADS_PUBLISH_TIMEOUT_MS = 3_500;
const THREADS_STATUS_POLL_TIMEOUT_MS = 2_500;
const THREADS_STATUS_POLL_INTERVAL_MS = 1_000;
// After a failed publish response we briefly confirm the container actually went live.
// Lives outside the 8s publish budget but well within the handler's 30s cap.
const THREADS_CONFIRM_BUDGET_MS = 3_000;
// Meta routinely emits a 500 code=1 ("unknown error") on threads_publish that a plain retry
// clears. Retry a handful of times, each guarded by confirmPublished so we never double-post.
//
// This retry (added in dc4f88a) is a deliberate error-rate/latency trade: a call that used to
// fail fast now spends up to (confirm poll + backoff) per attempt before succeeding, so its
// duration moves from the error bucket into the p99 success bucket. That's the whole story
// behind the 2026-07 p99 growth on threads_publish_thread (issue #173) — error rate fell in
// lockstep as p99 rose, and the exact same trade was made once before (773b2c2, reverted for
// the same latency reason) confirming it's the retry, not load or a Meta-side regression. Do
// not "fix" this by shortening THREADS_MEDIA_TOTAL_BUDGET_MS or the retry count without
// checking current error-rate impact first — that was already tried and reverted in 773b2c2.
// recordThreadsPublishOutcome() below marks the slow-path calls (retried / partial_success)
// so this trade-off's frequency is visible in SigNoz independent of the p99 number.
const THREADS_PUBLISH_MAX_ATTEMPTS = 3;
const THREADS_PUBLISH_RETRY_DELAY_MS = 600;

const THREADS_MAX_TEXT_LENGTH = 500;

function hasPublishMedia(params: Record<string, unknown>) {
  return params.media_type === "IMAGE" || params.media_type === "VIDEO";
}

const THREADS_CAROUSEL_MIN_ITEMS = 2;
const THREADS_CAROUSEL_MAX_ITEMS = 20;

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
  return pollUntilContainerReady(
    deadline,
    THREADS_STATUS_POLL_INTERVAL_MS,
    async () => {
      const result = (await threadsFetch(
        serviceConnectionId,
        `/${creationId}?fields=status,error_message`,
        { timeout: THREADS_STATUS_POLL_TIMEOUT_MS, retry: false }
      )) as ThreadsContainerStatus;
      return classifyContainerStatus(
        { status: result.status, errorMessage: result.error_message },
        "Threads"
      );
    }
  );
}

// The publish HTTP response is not atomic with Meta committing the post: a timeout or
// transient network error can fire after the post is already live. If we surfaced that
// error, the caller would retry and double-post. So we poll the container status — it
// flips to PUBLISHED once the post exists — and treat that as success. Best-effort:
// failures during the poll are swallowed; if we can't confirm, the original error stands.
// A terminal non-PUBLISHED status (still FINISHED, or ERROR/EXPIRED) proves the publish
// didn't take and won't spontaneously, so we return false immediately instead of burning
// the whole confirm budget — this keeps the guard cheap enough to run before every retry.
async function confirmPublished(
  serviceConnectionId: string,
  creationId: string
): Promise<boolean> {
  const deadline = Date.now() + THREADS_CONFIRM_BUDGET_MS;
  while (Date.now() < deadline) {
    try {
      const result = (await threadsFetch(
        serviceConnectionId,
        `/${creationId}?fields=status`,
        { timeout: THREADS_STATUS_POLL_TIMEOUT_MS, retry: false }
      )) as ThreadsContainerStatus;
      if (result.status === "PUBLISHED") return true;
      if (
        result.status === "FINISHED" ||
        result.status === "ERROR" ||
        result.status === "EXPIRED"
      ) {
        return false; // terminal, definitively not published — stop polling
      }
    } catch {
      // ignore — confirmation is best-effort
    }
    if (shouldStopPolling(Date.now(), deadline, THREADS_STATUS_POLL_INTERVAL_MS)) break;
    await sleep(THREADS_STATUS_POLL_INTERVAL_MS);
  }
  return false;
}

// Publishes a ready container, capping the timeout against the remaining budget. Meta
// routinely returns a transient 500 code=1 ("unknown error") on threads_publish that a
// plain retry clears, so we retry those (and 5xx/code=2) a few times while budget remains.
// Every attempt confirms via container status first: if the post actually went live it is
// reported as success (never a failure), and confirming before each retry prevents a
// double-post. A revoked/expired token surfaces immediately — that publish never happened.
async function publishContainer(
  serviceConnectionId: string,
  creationId: string,
  deadline: number
): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= THREADS_PUBLISH_MAX_ATTEMPTS; attempt++) {
    const publishTimeout = computeStepTimeout(THREADS_PUBLISH_TIMEOUT_MS, deadline, Date.now(), 0);
    try {
      const result = await threadsFetch(serviceConnectionId, "/me/threads_publish", {
        method: "POST",
        body: JSON.stringify({ creation_id: creationId }),
        timeout: publishTimeout,
        retry: false,
      });
      if (attempt > 1) recordThreadsPublishOutcome("success_after_retry");
      return result;
    } catch (err) {
      lastErr = err;
      // A revoked/expired token means the publish definitely did not happen — surface it.
      if (err instanceof OAuthTokenError) throw err;
      // The post may already be live (timeout/network fired after Meta committed it) — a
      // retry would double-post, so confirm before deciding to try again.
      if (await confirmPublished(serviceConnectionId, creationId)) {
        recordThreadsPublishOutcome("success_after_retry");
        return {
          status: "success",
          published: true,
          creation_id: creationId,
          message:
            "Thread was published — confirmed via container status after the publish response failed. Do not retry.",
        };
      }
      // Retry only Meta's transient 5xx/code=1/2 errors, and only while budget remains.
      const transient = err instanceof ThreadsApiError && err.isTransient;
      const budgetLeft = deadline - Date.now() > THREADS_PUBLISH_RETRY_DELAY_MS + 1_000;
      if (transient && budgetLeft && attempt < THREADS_PUBLISH_MAX_ATTEMPTS) {
        trace.getActiveSpan()?.setAttribute("threads.publish_retry", attempt);
        await sleep(THREADS_PUBLISH_RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Creates a single carousel item container (is_carousel_item=true). Meta downloads the
// referenced file synchronously before returning the id, so callers create items in
// parallel to keep wall-clock ≈ the slowest single download rather than their sum.
async function createCarouselItem(
  serviceConnectionId: string,
  item: { type: "IMAGE" | "VIDEO"; url: string },
  timeout: number
): Promise<string> {
  const body: Record<string, string> = {
    media_type: item.type,
    is_carousel_item: "true",
  };
  if (item.type === "IMAGE") body.image_url = item.url;
  else body.video_url = item.url;

  const result = (await threadsFetch(serviceConnectionId, "/me/threads", {
    method: "POST",
    body: JSON.stringify(body),
    timeout,
    retry: false,
  })) as { id: string };
  return result.id;
}

// Full carousel flow: create every item container in parallel, wait for all to reach
// FINISHED, create the carousel container referencing them, wait for it to finish, then
// publish. Bounded by the media budget / handler 30s cap. If any item is still processing
// when the poll deadline passes, returns partial_success (no creation_id to resume — the
// carousel container was never built, so the caller must retry from scratch).
async function publishCarousel(
  serviceConnectionId: string,
  items: Array<{ type: "IMAGE" | "VIDEO"; url: string }>,
  text: string | undefined,
  replyControl: string | undefined,
  quotePostId: string | undefined,
  deadline: number
): Promise<unknown> {
  const span = trace.getActiveSpan();
  span?.setAttribute("threads.media_type", "CAROUSEL");
  span?.setAttribute("threads.carousel_items", items.length);

  // Step 1: create all item containers in parallel.
  span?.setAttribute("threads.step", "create_items");
  const itemTimeout = computeStepTimeout(
    THREADS_MEDIA_CONTAINER_TIMEOUT_MS,
    deadline,
    Date.now(),
    THREADS_PUBLISH_TIMEOUT_MS
  );
  const itemIds = await Promise.all(
    items.map((item) =>
      createCarouselItem(serviceConnectionId, item, itemTimeout)
    )
  );

  // Step 2: wait for every item container to reach FINISHED before building the carousel.
  // Reserve budget for the carousel container + publish steps.
  span?.setAttribute("threads.step", "wait_items");
  const itemsPollDeadline = deadline - THREADS_PUBLISH_TIMEOUT_MS;
  const readiness = await Promise.all(
    itemIds.map((id) =>
      waitForContainerReady(serviceConnectionId, id, itemsPollDeadline)
    )
  );
  if (readiness.some((ready) => !ready)) {
    recordThreadsPublishOutcome("partial_success");
    return {
      status: "partial_success",
      item_ids: itemIds,
      message:
        "Carousel item containers were created, but some were still processing when the safe execution budget ran out. Retry the whole carousel — item containers cannot be reused once the request ends.",
    };
  }

  // Step 3: create the carousel container referencing the item ids.
  span?.setAttribute("threads.step", "create_carousel");
  const body: Record<string, string> = {
    media_type: "CAROUSEL",
    children: itemIds.join(","),
  };
  if (text) body.text = text;
  if (replyControl) body.reply_control = replyControl;
  if (quotePostId) body.quote_post_id = quotePostId;

  const carouselResult = (await threadsFetch(serviceConnectionId, "/me/threads", {
    method: "POST",
    body: JSON.stringify(body),
    timeout: THREADS_MEDIA_CONTAINER_TIMEOUT_MS,
    retry: false,
  })) as { id: string };
  span?.setAttribute("threads.container_id", carouselResult.id);

  // Step 4: the carousel container itself must reach FINISHED before publishing.
  span?.setAttribute("threads.step", "wait_carousel");
  const ready = await waitForContainerReady(
    serviceConnectionId,
    carouselResult.id,
    deadline - THREADS_PUBLISH_TIMEOUT_MS
  );
  if (!ready) {
    recordThreadsPublishOutcome("partial_success");
    return {
      status: "partial_success",
      creation_id: carouselResult.id,
      message:
        "Carousel container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
    };
  }

  // Step 5: publish.
  span?.setAttribute("threads.step", "publish");
  return publishContainer(serviceConnectionId, carouselResult.id, deadline);
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
    description: "Create and publish a thread. For text posts, set media_type to TEXT. For images, set to IMAGE with image_url. For videos, set to VIDEO with video_url. For a carousel (2-20 images/videos in one post), set media_type to CAROUSEL and pass items[] with each media's type and url; text is the carousel caption.",
    action: "threads:publish_thread",
    inputSchema: z.object({
      text: z.string().max(THREADS_MAX_TEXT_LENGTH).optional().describe("Post text (max 500 characters); for CAROUSEL this is the caption on the whole post"),
      media_type: z.enum(["TEXT", "IMAGE", "VIDEO", "CAROUSEL"]).describe("Type of media"),
      image_url: z.string().optional().describe("Public URL of the image (for IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (for VIDEO type)"),
      items: z
        .array(
          z.object({
            type: z.enum(["IMAGE", "VIDEO"]).describe("Media type of this carousel item"),
            url: z.string().describe("Public URL of the image or video"),
          })
        )
        .min(THREADS_CAROUSEL_MIN_ITEMS)
        .max(THREADS_CAROUSEL_MAX_ITEMS)
        .optional()
        .describe("Carousel items (2-20), required for CAROUSEL type"),
      reply_control: z.enum(["everyone", "accounts_you_follow", "mentioned_only"]).optional().describe("Who can reply"),
      link_attachment: z.string().optional().describe("URL to attach (TEXT posts only)"),
      quote_post_id: z.string().optional().describe("ID of post to quote"),
    }),
    handler: async (params, context) => {
      if (params.media_type === "CAROUSEL") {
        const items = params.items as
          | Array<{ type: "IMAGE" | "VIDEO"; url: string }>
          | undefined;
        if (!items || items.length < THREADS_CAROUSEL_MIN_ITEMS) {
          throw new Error(
            `CAROUSEL requires items[] with ${THREADS_CAROUSEL_MIN_ITEMS}-${THREADS_CAROUSEL_MAX_ITEMS} media entries`
          );
        }
        const carouselDeadline = Date.now() + THREADS_MEDIA_TOTAL_BUDGET_MS;
        return publishCarousel(
          context.serviceConnectionId,
          items,
          params.text as string | undefined,
          params.reply_control as string | undefined,
          params.quote_post_id as string | undefined,
          carouselDeadline
        );
      }

      const isMedia = hasPublishMedia(params);
      const deadline =
        Date.now() +
        (isMedia ? THREADS_MEDIA_TOTAL_BUDGET_MS : THREADS_TEXT_TOTAL_BUDGET_MS);
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

      const containerTimeout = computeStepTimeout(
        isMedia ? THREADS_MEDIA_CONTAINER_TIMEOUT_MS : THREADS_TEXT_CONTAINER_TIMEOUT_MS,
        deadline,
        Date.now(),
        THREADS_PUBLISH_TIMEOUT_MS
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
        recordThreadsPublishOutcome("partial_success");
        return {
          status: "partial_success",
          creation_id: containerResult.id,
          message:
            "Threads container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
        };
      }

      // Step 3: Publish — cap timeout against remaining budget so total never exceeds 8s
      span?.setAttribute("threads.step", "publish");
      return publishContainer(context.serviceConnectionId, containerResult.id, deadline);
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
      const isMedia = hasPublishMedia(params);
      const deadline =
        Date.now() +
        (isMedia ? THREADS_MEDIA_TOTAL_BUDGET_MS : THREADS_TEXT_TOTAL_BUDGET_MS);

      // Step 1: Create reply container
      const body: Record<string, string> = {
        media_type: params.media_type as string,
        reply_to_id: params.reply_to_id as string,
      };
      if (params.text) body.text = params.text as string;
      if (params.image_url) body.image_url = params.image_url as string;
      if (params.video_url) body.video_url = params.video_url as string;

      const containerTimeout = computeStepTimeout(
        isMedia ? THREADS_MEDIA_CONTAINER_TIMEOUT_MS : THREADS_TEXT_CONTAINER_TIMEOUT_MS,
        deadline,
        Date.now(),
        THREADS_PUBLISH_TIMEOUT_MS
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
        recordThreadsPublishOutcome("partial_success");
        return {
          status: "partial_success",
          creation_id: containerResult.id,
          message:
            "Reply container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
        };
      }

      // Step 3: Publish reply — cap timeout against remaining budget
      return publishContainer(context.serviceConnectionId, containerResult.id, deadline);
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
