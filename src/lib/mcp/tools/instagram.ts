import { z } from "zod";
import { trace } from "@opentelemetry/api";
import { instagramFetch } from "../instagram";
import type { ToolDefinition } from "./types";
import {
  classifyContainerStatus,
  waitForContainerReady as pollUntilContainerReady,
} from "./container-poll";

// Instagram publishes media asynchronously: creating a container returns an id
// immediately, but Meta must finish processing it (downloading/transcoding the
// referenced file) before it can be published. So we poll the container's
// status_code until FINISHED, then publish — all inside the handler's 30s cap.
const IG_TOTAL_BUDGET_MS = 25_000;
const IG_CONTAINER_TIMEOUT_MS = 18_000;
const IG_PUBLISH_TIMEOUT_MS = 4_000;
const IG_STATUS_POLL_TIMEOUT_MS = 2_500;
const IG_STATUS_POLL_INTERVAL_MS = 1_000;

const IG_CAROUSEL_MIN_ITEMS = 2;
const IG_CAROUSEL_MAX_ITEMS = 10; // Instagram caps carousels at 10 items.
const IG_MAX_CAPTION_LENGTH = 2_200;

type IgContainerStatus = {
  status_code?: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
};

// Polls a media container until Meta finishes processing it. Returns true once
// it reaches FINISHED, false if the deadline passes while still IN_PROGRESS.
// Throws on the unrecoverable ERROR/EXPIRED states.
async function waitForContainerReady(
  serviceConnectionId: string,
  creationId: string,
  deadline: number
): Promise<boolean> {
  return pollUntilContainerReady(
    deadline,
    IG_STATUS_POLL_INTERVAL_MS,
    async () => {
      const result = (await instagramFetch(
        serviceConnectionId,
        `/${creationId}?fields=status_code`,
        { timeout: IG_STATUS_POLL_TIMEOUT_MS, retry: false }
      )) as IgContainerStatus;
      return classifyContainerStatus({ status: result.status_code }, "Instagram");
    }
  );
}

async function publishContainer(
  serviceConnectionId: string,
  creationId: string
): Promise<unknown> {
  return instagramFetch(serviceConnectionId, "/me/media_publish", {
    method: "POST",
    body: JSON.stringify({ creation_id: creationId }),
    timeout: IG_PUBLISH_TIMEOUT_MS,
    retry: false,
  });
}

// Creates a single container and returns its id. `body` carries the media params
// (image_url / video_url / media_type / caption / children / is_carousel_item).
async function createContainer(
  serviceConnectionId: string,
  body: Record<string, string>,
  timeout: number
): Promise<string> {
  const result = (await instagramFetch(serviceConnectionId, "/me/media", {
    method: "POST",
    body: JSON.stringify(body),
    timeout,
    retry: false,
  })) as { id: string };
  return result.id;
}

async function publishCarousel(
  serviceConnectionId: string,
  items: Array<{ type: "IMAGE" | "VIDEO"; url: string }>,
  caption: string | undefined,
  deadline: number
): Promise<unknown> {
  const span = trace.getActiveSpan();
  span?.setAttribute("instagram.media_type", "CAROUSEL");
  span?.setAttribute("instagram.carousel_items", items.length);

  // Step 1: create every child container in parallel (Meta downloads each file
  // synchronously, so wall-clock ≈ slowest single download, not the sum).
  const childIds = await Promise.all(
    items.map((item) => {
      const body: Record<string, string> = { is_carousel_item: "true" };
      if (item.type === "IMAGE") body.image_url = item.url;
      else {
        body.media_type = "VIDEO";
        body.video_url = item.url;
      }
      return createContainer(serviceConnectionId, body, IG_CONTAINER_TIMEOUT_MS);
    })
  );

  // Step 2: wait for every child to finish before building the carousel.
  const childDeadline = deadline - IG_PUBLISH_TIMEOUT_MS;
  const readiness = await Promise.all(
    childIds.map((id) => waitForContainerReady(serviceConnectionId, id, childDeadline))
  );
  if (readiness.some((ready) => !ready)) {
    return {
      status: "partial_success",
      child_ids: childIds,
      message:
        "Carousel child containers were created, but some were still processing when the safe execution budget ran out. Retry the whole carousel.",
    };
  }

  // Step 3: create the carousel container referencing the children.
  const parentBody: Record<string, string> = {
    media_type: "CAROUSEL",
    children: childIds.join(","),
  };
  if (caption) parentBody.caption = caption;
  const parentId = await createContainer(serviceConnectionId, parentBody, IG_CONTAINER_TIMEOUT_MS);

  // Step 4: the carousel container itself must reach FINISHED before publishing.
  const ready = await waitForContainerReady(
    serviceConnectionId,
    parentId,
    deadline - IG_PUBLISH_TIMEOUT_MS
  );
  if (!ready) {
    return {
      status: "partial_success",
      creation_id: parentId,
      message:
        "Carousel container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
    };
  }

  return publishContainer(serviceConnectionId, parentId);
}

export const instagramTools: ToolDefinition[] = [
  {
    name: "instagram_create_post",
    description:
      "Create and publish a post to Instagram. For a single image set media_type to IMAGE with image_url. For a single video/reel set media_type to REELS with video_url. For a carousel (2-10 images/videos in one post) set media_type to CAROUSEL and pass items[]; caption applies to the whole post. Image/video URLs must be public. Note: Instagram allows up to 100 published posts per 24h.",
    action: "instagram:create_post",
    inputSchema: z.object({
      media_type: z.enum(["IMAGE", "REELS", "CAROUSEL"]).describe("Type of post"),
      caption: z
        .string()
        .max(IG_MAX_CAPTION_LENGTH)
        .optional()
        .describe("Caption text (max 2200 characters); hashtags allowed"),
      image_url: z.string().optional().describe("Public URL of the image (IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (REELS type)"),
      items: z
        .array(
          z.object({
            type: z.enum(["IMAGE", "VIDEO"]).describe("Media type of this carousel item"),
            url: z.string().describe("Public URL of the image or video"),
          })
        )
        .min(IG_CAROUSEL_MIN_ITEMS)
        .max(IG_CAROUSEL_MAX_ITEMS)
        .optional()
        .describe("Carousel items (2-10), required for CAROUSEL type"),
    }),
    handler: async (params, context) => {
      const deadline = Date.now() + IG_TOTAL_BUDGET_MS;

      if (params.media_type === "CAROUSEL") {
        const items = params.items as
          | Array<{ type: "IMAGE" | "VIDEO"; url: string }>
          | undefined;
        if (!items || items.length < IG_CAROUSEL_MIN_ITEMS) {
          throw new Error(
            `CAROUSEL requires items[] with ${IG_CAROUSEL_MIN_ITEMS}-${IG_CAROUSEL_MAX_ITEMS} media entries`
          );
        }
        return publishCarousel(
          context.serviceConnectionId,
          items,
          params.caption as string | undefined,
          deadline
        );
      }

      const span = trace.getActiveSpan();
      span?.setAttribute("instagram.media_type", params.media_type as string);

      // Step 1: create the media container.
      const body: Record<string, string> = {};
      if (params.caption) body.caption = params.caption as string;
      if (params.media_type === "IMAGE") {
        if (!params.image_url) throw new Error("IMAGE requires image_url");
        body.image_url = params.image_url as string;
      } else {
        if (!params.video_url) throw new Error("REELS requires video_url");
        body.media_type = "REELS";
        body.video_url = params.video_url as string;
      }
      const creationId = await createContainer(
        context.serviceConnectionId,
        body,
        IG_CONTAINER_TIMEOUT_MS
      );
      span?.setAttribute("instagram.container_id", creationId);

      // Step 2: wait for the container to finish processing.
      const ready = await waitForContainerReady(
        context.serviceConnectionId,
        creationId,
        deadline - IG_PUBLISH_TIMEOUT_MS
      );
      if (!ready) {
        return {
          status: "partial_success",
          creation_id: creationId,
          message:
            "Instagram container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
        };
      }

      // Step 3: publish.
      return publishContainer(context.serviceConnectionId, creationId);
    },
  },
  {
    name: "instagram_list_media",
    description: "List the authenticated Instagram account's published media",
    action: "instagram:list_media",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of media to return (default 25)"),
      after: z.string().optional().describe("Pagination cursor"),
    }),
    handler: async (params, context) => {
      const fields =
        "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count";
      let path = `/me/media?fields=${fields}&limit=${params.limit ?? 25}`;
      if (params.after) path += `&after=${params.after}`;
      return instagramFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "instagram_get_account",
    description: "Get the authenticated Instagram account's profile",
    action: "instagram:get_account",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return instagramFetch(
        context.serviceConnectionId,
        "/me?fields=id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count"
      );
    },
  },
];
