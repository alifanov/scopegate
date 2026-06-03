import { z } from 'zod';
import { youtubeFetch, youtubeUploadVideo } from '../youtube';
import type { ToolDefinition } from './types';

export const youtubeTools: ToolDefinition[] = [
  // YouTube tools
  {
    name: "youtube_list_channels",
    description: "List YouTube channels for the authenticated user",
    action: "youtube:list_channels",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        mine: "true",
        maxResults: String(params.maxResults ?? 10),
      });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_channel",
    description: "Get details of a YouTube channel by ID",
    action: "youtube:get_channel",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails,brandingSettings",
        id: params.channelId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_videos",
    description: "List videos from a channel or the authenticated user's uploads",
    action: "youtube:list_videos",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
      order: z.enum(["date", "rating", "relevance", "title", "viewCount"]).optional().default("date"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "date",
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("forMine", "true");
      }
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      // search.list only supports snippet; fetch full details via videos.list
      const searchResult = await youtubeFetch(context.serviceConnectionId, `/search?${query.toString()}`) as { items?: Array<{ id?: { videoId?: string }; snippet?: unknown }>; [key: string]: unknown };
      const videoIds = (searchResult.items ?? [])
        .map((item) => item.id?.videoId)
        .filter(Boolean)
        .join(",");
      if (!videoIds) return searchResult;
      const detailQuery = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: videoIds,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos?${detailQuery.toString()}`);
    },
  },
  {
    name: "youtube_get_video",
    description: "Get details of a YouTube video by ID",
    action: "youtube:get_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails,status",
        id: params.videoId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`);
    },
  },
  {
    name: "youtube_upload_video",
    description: "Upload a video to YouTube from a URL. Downloads the video from the provided URL and uploads it via the YouTube resumable upload API. Returns the created video resource including video ID.",
    action: "youtube:upload_video",
    inputSchema: z.object({
      videoUrl: z.string().url("Must be a valid URL to the video file"),
      title: z.string().min(1).max(100),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).optional(),
      categoryId: z.string().optional().describe("YouTube video category ID (default: 22 - People & Blogs)"),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional().describe("Video privacy status (default: private)"),
    }),
    handler: async (params, context) => {
      return youtubeUploadVideo(context.serviceConnectionId, params.videoUrl as string, {
        title: params.title as string,
        description: params.description as string | undefined,
        tags: params.tags as string[] | undefined,
        categoryId: params.categoryId as string | undefined,
        privacyStatus: params.privacyStatus as "public" | "private" | "unlisted" | undefined,
      });
    },
  },
  {
    name: "youtube_update_video",
    description: "Update metadata for a YouTube video",
    action: "youtube:update_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      categoryId: z.string().optional(),
    }),
    handler: async (params, context) => {
      const { videoId, ...fields } = params;
      const body: Record<string, unknown> = { id: videoId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.description) snippet.description = fields.description;
      if (fields.tags) snippet.tags = fields.tags;
      if (fields.categoryId) snippet.categoryId = fields.categoryId;
      if (Object.keys(snippet).length > 0) {
        // YouTube requires categoryId when updating snippet — fetch current value if not provided
        if (!snippet.categoryId) {
          const q = new URLSearchParams({ part: "snippet", id: String(videoId) });
          const current = await youtubeFetch(context.serviceConnectionId, `/videos?${q.toString()}`);
          const currentData = typeof current === "string" ? JSON.parse(current) : current;
          snippet.categoryId = currentData?.items?.[0]?.snippet?.categoryId ?? "22";
        }
        body.snippet = snippet;
      }
      if (fields.privacyStatus) body.status = { privacyStatus: fields.privacyStatus };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.status) parts.push("status");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_video",
    description: "Delete a YouTube video",
    action: "youtube:delete_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.videoId as string });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_playlists",
    description: "List playlists for the authenticated user or a channel",
    action: "youtube:list_playlists",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_playlist",
    description: "Get details of a YouTube playlist by ID",
    action: "youtube:get_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        id: params.playlistId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`);
    },
  },
  {
    name: "youtube_create_playlist",
    description: "Create a new YouTube playlist",
    action: "youtube:create_playlist",
    inputSchema: z.object({
      title: z.string(),
      description: z.string().optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional().default("private"),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          title: params.title,
          description: params.description || "",
        },
        status: {
          privacyStatus: params.privacyStatus || "private",
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/playlists?part=snippet,status", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_playlist",
    description: "Update a YouTube playlist",
    action: "youtube:update_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
    }),
    handler: async (params, context) => {
      const { playlistId, ...fields } = params;
      const body: Record<string, unknown> = { id: playlistId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.description) snippet.description = fields.description;
      if (Object.keys(snippet).length > 0) body.snippet = snippet;
      if (fields.privacyStatus) body.status = { privacyStatus: fields.privacyStatus };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.status) parts.push("status");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_playlist",
    description: "Delete a YouTube playlist",
    action: "youtube:delete_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.playlistId as string });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_playlist_items",
    description: "List videos in a YouTube playlist",
    action: "youtube:list_playlist_items",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        playlistId: params.playlistId as string,
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?${query.toString()}`);
    },
  },
  {
    name: "youtube_add_playlist_item",
    description: "Add a video to a YouTube playlist",
    action: "youtube:add_playlist_item",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      position: z.number().optional(),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        snippet: {
          playlistId: params.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: params.videoId,
          },
        },
      };
      if (params.position !== undefined) {
        (body.snippet as Record<string, unknown>).position = params.position;
      }
      return youtubeFetch(context.serviceConnectionId, "/playlistItems?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_remove_playlist_item",
    description: "Remove a video from a YouTube playlist",
    action: "youtube:remove_playlist_item",
    inputSchema: z.object({
      playlistItemId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist item ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.playlistItemId as string });
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_search",
    description: "Search YouTube for videos, channels, or playlists",
    action: "youtube:search",
    inputSchema: z.object({
      query: z.string(),
      type: z.enum(["video", "channel", "playlist"]).optional().default("video"),
      maxResults: z.number().optional().default(10),
      order: z.enum(["date", "rating", "relevance", "title", "viewCount"]).optional().default("relevance"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        q: params.query as string,
        type: (params.type as string) || "video",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "relevance",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/search?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_comments",
    description: "List comments on a YouTube video",
    action: "youtube:list_comments",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      maxResults: z.number().optional().default(20),
      order: z.enum(["time", "relevance"]).optional().default("time"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,replies",
        videoId: params.videoId as string,
        maxResults: String(params.maxResults ?? 20),
        order: (params.order as string) || "time",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/commentThreads?${query.toString()}`);
    },
  },
  {
    name: "youtube_add_comment",
    description: "Add a comment to a YouTube video",
    action: "youtube:add_comment",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          videoId: params.videoId,
          topLevelComment: {
            snippet: {
              textOriginal: params.text,
            },
          },
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/commentThreads?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_comment",
    description: "Delete a YouTube comment",
    action: "youtube:delete_comment",
    inputSchema: z.object({
      commentId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.commentId as string });
      return youtubeFetch(context.serviceConnectionId, `/comments?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_subscriptions",
    description: "List subscriptions for the authenticated user",
    action: "youtube:list_subscriptions",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
      order: z.enum(["alphabetical", "relevance", "unread"]).optional().default("relevance"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails",
        mine: "true",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "relevance",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_analytics",
    description: "Get analytics for the authenticated user's YouTube channel (views, watch time, subscribers)",
    action: "youtube:get_analytics",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      // Use the YouTube Data API to get channel statistics (basic analytics)
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.channelId) {
        query.set("id", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },

  // ─── YouTube additional tools ──────────────────────────────────────────
  {
    name: "youtube_update_channel",
    description: "Update YouTube channel branding settings (title, description, keywords, country)",
    action: "youtube:update_channel",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional().describe("Space-separated keywords"),
      country: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
      defaultLanguage: z.string().optional().describe("BCP-47 language code"),
      madeForKids: z.boolean().optional(),
    }),
    handler: async (params, context) => {
      const { channelId, madeForKids, ...fields } = params;
      const body: Record<string, unknown> = { id: channelId };
      const channel: Record<string, unknown> = {};
      if (fields.title) channel.title = fields.title;
      if (fields.description) channel.description = fields.description;
      if (fields.keywords) channel.keywords = fields.keywords;
      if (fields.country) channel.country = fields.country;
      if (fields.defaultLanguage) channel.defaultLanguage = fields.defaultLanguage;

      const parts: string[] = [];
      if (Object.keys(channel).length > 0) {
        body.brandingSettings = { channel };
        parts.push("brandingSettings");
      }
      if (madeForKids !== undefined) {
        body.status = { selfDeclaredMadeForKids: madeForKids };
        parts.push("status");
      }
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_list_captions",
    description: "List caption tracks for a YouTube video",
    action: "youtube:list_captions",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        videoId: params.videoId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/captions?${query.toString()}`);
    },
  },
  {
    name: "youtube_download_caption",
    description: "Download caption track content for a YouTube video",
    action: "youtube:download_caption",
    inputSchema: z.object({
      captionId: z.string(),
      tfmt: z.enum(["sbv", "scc", "srt", "ttml", "vtt"]).optional().default("srt").describe("Caption format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.tfmt) query.set("tfmt", params.tfmt as string);
      const qs = query.toString();
      return youtubeFetch(
        context.serviceConnectionId,
        `/captions/${params.captionId}${qs ? `?${qs}` : ""}`,
        undefined,
        { responseType: "text" },
      );
    },
  },
  {
    name: "youtube_delete_caption",
    description: "Delete a caption track from a YouTube video",
    action: "youtube:delete_caption",
    inputSchema: z.object({
      captionId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.captionId as string });
      return youtubeFetch(context.serviceConnectionId, `/captions?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_channel_sections",
    description: "List sections of a YouTube channel",
    action: "youtube:list_channel_sections",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format").optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails",
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`);
    },
  },
  {
    name: "youtube_create_channel_section",
    description: "Create a section on a YouTube channel",
    action: "youtube:create_channel_section",
    inputSchema: z.object({
      type: z.enum(["singlePlaylist", "multiplePlaylists", "popularUploads", "recentUploads", "likes", "allPlaylists", "recentActivity", "recentPosts"]),
      title: z.string().optional(),
      position: z.number().optional(),
      playlistIds: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const snippet: Record<string, unknown> = { type: params.type };
      if (params.title) snippet.title = params.title;
      if (params.position !== undefined) snippet.position = params.position;

      const body: Record<string, unknown> = { snippet };
      const parts = ["snippet"];
      if ((params.playlistIds as string[] | undefined)?.length) {
        body.contentDetails = { playlists: params.playlistIds };
        parts.push("contentDetails");
      }
      return youtubeFetch(context.serviceConnectionId, `/channelSections?part=${parts.join(",")}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_channel_section",
    description: "Update a section on a YouTube channel",
    action: "youtube:update_channel_section",
    inputSchema: z.object({
      sectionId: z.string(),
      title: z.string().optional(),
      position: z.number().optional(),
      playlistIds: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { sectionId, ...fields } = params;
      const body: Record<string, unknown> = { id: sectionId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.position !== undefined) snippet.position = fields.position;
      if (Object.keys(snippet).length > 0) body.snippet = snippet;
      if ((fields.playlistIds as string[] | undefined)?.length) body.contentDetails = { playlists: fields.playlistIds };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.contentDetails) parts.push("contentDetails");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_channel_section",
    description: "Delete a section from a YouTube channel",
    action: "youtube:delete_channel_section",
    inputSchema: z.object({
      sectionId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.sectionId as string });
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_comment_replies",
    description: "List replies to a YouTube comment",
    action: "youtube:list_comment_replies",
    inputSchema: z.object({
      parentId: z.string().describe("The comment ID to get replies for"),
      maxResults: z.number().optional().default(20),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        parentId: params.parentId as string,
        maxResults: String(params.maxResults ?? 20),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/comments?${query.toString()}`);
    },
  },
  {
    name: "youtube_reply_to_comment",
    description: "Reply to an existing YouTube comment",
    action: "youtube:reply_to_comment",
    inputSchema: z.object({
      parentId: z.string().describe("The comment ID to reply to"),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          parentId: params.parentId,
          textOriginal: params.text,
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/comments?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_comment",
    description: "Edit a YouTube comment",
    action: "youtube:update_comment",
    inputSchema: z.object({
      commentId: z.string(),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        id: params.commentId,
        snippet: {
          textOriginal: params.text,
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/comments?part=snippet", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_set_comment_moderation",
    description: "Set moderation status for YouTube comments (held for review, published, or rejected)",
    action: "youtube:set_comment_moderation",
    inputSchema: z.object({
      commentId: z.string(),
      moderationStatus: z.enum(["heldForReview", "published", "rejected"]),
      banAuthor: z.boolean().optional().default(false),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: params.commentId as string,
        moderationStatus: params.moderationStatus as string,
        banAuthor: String(params.banAuthor ?? false),
      });
      return youtubeFetch(context.serviceConnectionId, `/comments/setModerationStatus?${query.toString()}`, {
        method: "POST",
      });
    },
  },
  {
    name: "youtube_list_languages",
    description: "List content languages supported by YouTube",
    action: "youtube:list_languages",
    inputSchema: z.object({
      hl: z.string().optional().describe("Host language for response localization (BCP-47 code)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ part: "snippet" });
      if (params.hl) query.set("hl", params.hl as string);
      return youtubeFetch(context.serviceConnectionId, `/i18nLanguages?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_regions",
    description: "List content regions supported by YouTube",
    action: "youtube:list_regions",
    inputSchema: z.object({
      hl: z.string().optional().describe("Host language for response localization (BCP-47 code)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ part: "snippet" });
      if (params.hl) query.set("hl", params.hl as string);
      return youtubeFetch(context.serviceConnectionId, `/i18nRegions?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_members",
    description: "List members of the authenticated user's YouTube channel (requires channel memberships)",
    action: "youtube:list_members",
    inputSchema: z.object({
      mode: z.enum(["list_members", "updates"]).optional().default("list_members"),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
      filterByMemberChannelId: z.string().optional().describe("Filter by specific member channel ID"),
      hasAccessToLevel: z.string().optional().describe("Filter by membership level ID"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        mode: (params.mode as string) || "list_members",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      if (params.filterByMemberChannelId) query.set("filterByMemberChannelId", params.filterByMemberChannelId as string);
      if (params.hasAccessToLevel) query.set("hasAccessToLevel", params.hasAccessToLevel as string);
      return youtubeFetch(context.serviceConnectionId, `/members?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_membership_levels",
    description: "List membership levels for the authenticated user's YouTube channel",
    action: "youtube:list_membership_levels",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return youtubeFetch(context.serviceConnectionId, "/membershipsLevels?part=snippet");
    },
  },
  {
    name: "youtube_update_playlist_item",
    description: "Update position or video note for a playlist item",
    action: "youtube:update_playlist_item",
    inputSchema: z.object({
      playlistItemId: z.string(),
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      position: z.number().optional(),
      note: z.string().optional(),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        id: params.playlistItemId,
        snippet: {
          playlistId: params.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: params.videoId,
          },
        },
      };
      if (params.position !== undefined) {
        (body.snippet as Record<string, unknown>).position = params.position;
      }
      if (params.note) {
        body.contentDetails = { note: params.note };
      }
      const parts = ["snippet"];
      if (body.contentDetails) parts.push("contentDetails");
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?part=${parts.join(",")}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_subscribe",
    description: "Subscribe to a YouTube channel",
    action: "youtube:subscribe",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          resourceId: {
            kind: "youtube#channel",
            channelId: params.channelId,
          },
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/subscriptions?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_unsubscribe",
    description: "Unsubscribe from a YouTube channel",
    action: "youtube:unsubscribe",
    inputSchema: z.object({
      subscriptionId: z.string().describe("The subscription ID (not the channel ID)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.subscriptionId as string });
      return youtubeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_categories",
    description: "List YouTube video categories for a region",
    action: "youtube:list_categories",
    inputSchema: z.object({
      regionCode: z.string().optional().default("US").describe("ISO 3166-1 alpha-2 country code"),
      hl: z.string().optional().default("en").describe("Language for category titles"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        regionCode: (params.regionCode as string) || "US",
        hl: (params.hl as string) || "en",
      });
      return youtubeFetch(context.serviceConnectionId, `/videoCategories?${query.toString()}`);
    },
  },
  {
    name: "youtube_rate_video",
    description: "Rate a YouTube video (like, dislike, or remove rating)",
    action: "youtube:rate_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      rating: z.enum(["like", "dislike", "none"]),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: params.videoId as string,
        rating: params.rating as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos/rate?${query.toString()}`, {
        method: "POST",
      });
    },
  },
  {
    name: "youtube_get_rating",
    description: "Get the authenticated user's rating for YouTube videos",
    action: "youtube:get_rating",
    inputSchema: z.object({
      videoIds: z.array(z.string()).describe("Video IDs to check ratings for (max 50)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: (params.videoIds as string[]).join(","),
      });
      return youtubeFetch(context.serviceConnectionId, `/videos/getRating?${query.toString()}`);
    },
  },
  {
    name: "youtube_unset_watermark",
    description: "Remove the watermark image from a YouTube channel",
    action: "youtube:unset_watermark",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ channelId: params.channelId as string });
      return youtubeFetch(context.serviceConnectionId, `/watermarks/unset?${query.toString()}`, {
        method: "POST",
      });
    },
  },

];
