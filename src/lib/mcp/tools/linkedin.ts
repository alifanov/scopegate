import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { z } from 'zod';
import {
  LINKEDIN_CREATE_POST_TIMEOUT_MS,
  LINKEDIN_VERSION,
  linkedinFetch,
  getLinkedInMemberUrn,
  linkedinUploadImage,
} from '../linkedin';
import { downloadImage } from '../image-utils';
import type { ToolDefinition } from './types';

const tracer = trace.getTracer("scopegate");

function traceLinkedInCreatePostPhase<T>(
  phase: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return tracer.startActiveSpan(
    `linkedin_create_post.${phase}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        "mcp.tool": "linkedin_create_post",
        "linkedin.phase": phase,
        ...attributes,
      },
    },
    async (span) => {
      try {
        return await fn();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        if (err instanceof Error) {
          span.recordException(err);
        }
        throw err;
      } finally {
        span.end();
      }
    }
  );
}

export const linkedinTools: ToolDefinition[] = [
  // LinkedIn tools
  {
    name: "linkedin_get_profile",
    description: "Get the authenticated LinkedIn user's profile (name, email, picture)",
    action: "linkedin:get_profile",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return linkedinFetch(context.serviceConnectionId, "/userinfo", { useV2: true });
    },
  },
  {
    name: "linkedin_create_post",
    description: "Create a new LinkedIn post (text, with link, or with image)",
    action: "linkedin:create_post",
    inputSchema: z.object({
      text: z.string().describe("The text content of the post"),
      link: z.string().url().optional().describe("Optional URL to share with the post"),
      image_url: z.string().optional().describe("Optional image to attach to the post — either a URL or a base64 data URI (e.g. data:image/jpeg;base64,...). JPEG, PNG, or GIF, max 5MB. Cannot be used together with link."),
    }),
    handler: async (params, context) => {
      if (params.link && params.image_url) {
        throw new Error("Cannot use both 'link' and 'image_url' — LinkedIn posts support one content type at a time.");
      }

      const body = await traceLinkedInCreatePostPhase(
        "prepare_payload",
        async () => {
          const authorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
          const payload: Record<string, unknown> = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            visibility: "PUBLIC",
            commentary: params.text as string,
            distribution: {
              feedDistribution: "MAIN_FEED",
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
          };

          if (params.link) {
            payload.content = {
              article: {
                source: params.link,
              },
            };
          }

          return payload;
        },
        {
          "linkedin.content_type": params.link ? "link" : params.image_url ? "image" : "text",
        }
      );

      if (params.image_url) {
        const imageUrn = await traceLinkedInCreatePostPhase(
          "prepare_image",
          async () => {
            const image = await downloadImage(params.image_url as string);
            return linkedinUploadImage(
              context.serviceConnectionId,
              image.buffer,
              image.mimeType
            );
          }
        );

        body.content = {
          media: {
            id: imageUrn,
          },
        };
      }

      const response = await traceLinkedInCreatePostPhase(
        "http_request",
        () =>
          linkedinFetch(context.serviceConnectionId, "/posts", {
            method: "POST",
            body: JSON.stringify(body),
            timeout: LINKEDIN_CREATE_POST_TIMEOUT_MS,
          }),
        {
          "http.method": "POST",
          "url.path": "/posts",
          "linkedin.api_version": LINKEDIN_VERSION,
          "linkedin.timeout_ms": LINKEDIN_CREATE_POST_TIMEOUT_MS,
        }
      );

      return traceLinkedInCreatePostPhase(
        "process_response",
        async () => response,
        { "linkedin.result_type": typeof response }
      );
    },
  },
  {
    name: "linkedin_delete_post",
    description: "Delete a LinkedIn post by its URN",
    action: "linkedin:delete_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to delete (e.g. urn:li:share:123456)"),
    }),
    handler: async (params, context) => {
      const encodedUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(context.serviceConnectionId, `/posts/${encodedUrn}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "linkedin_get_post",
    description: "Get a LinkedIn post by its URN",
    action: "linkedin:get_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post (e.g. urn:li:share:123456)"),
    }),
    handler: async (params, context) => {
      const encodedUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(context.serviceConnectionId, `/posts/${encodedUrn}`);
    },
  },
  {
    name: "linkedin_like_post",
    description: "Like (react to) a LinkedIn post",
    action: "linkedin:like_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to like"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const body = {
        root: params.post_urn,
        reactionType: "LIKE",
        actor: actorUrn,
      };
      return linkedinFetch(context.serviceConnectionId, "/reactions", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "linkedin_unlike_post",
    description: "Remove a like (reaction) from a LinkedIn post",
    action: "linkedin:unlike_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to unlike"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const encodedActorUrn = encodeURIComponent(actorUrn);
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(
        context.serviceConnectionId,
        `/reactions/${encodedPostUrn}?actor=${encodedActorUrn}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "linkedin_comment_on_post",
    description: "Add a comment to a LinkedIn post",
    action: "linkedin:comment_on_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to comment on"),
      text: z.string().describe("The comment text"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      const body = {
        actor: actorUrn,
        object: params.post_urn,
        message: {
          text: params.text,
        },
      };
      return linkedinFetch(
        context.serviceConnectionId,
        `/socialActions/${encodedPostUrn}/comments`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "linkedin_get_post_comments",
    description: "Get comments on a LinkedIn post",
    action: "linkedin:get_post_comments",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post"),
      count: z.number().min(1).max(100).optional().default(10).describe("Number of comments to return"),
      start: z.number().optional().default(0).describe("Offset for pagination"),
    }),
    handler: async (params, context) => {
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      const query = new URLSearchParams({
        count: String(params.count ?? 10),
        start: String(params.start ?? 0),
      });
      return linkedinFetch(
        context.serviceConnectionId,
        `/socialActions/${encodedPostUrn}/comments?${query.toString()}`
      );
    },
  },
];
