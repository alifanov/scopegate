import { z } from 'zod';
import { twitterFetch, getAuthenticatedUserId, twitterUploadMedia } from '../twitter';
import { downloadImage } from '../image-utils';
import type { ToolDefinition } from './types';

export const twitterTools: ToolDefinition[] = [
  // Twitter tools
  {
    name: "twitter_search_tweets",
    description: "Search recent tweets matching a query",
    action: "twitter:search_tweets",
    inputSchema: z.object({
      query: z.string(),
      max_results: z.number().min(10).max(100).optional().default(10),
      tweet_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        query: params.query as string,
        max_results: String(params.max_results ?? 10),
      });
      if (params.tweet_fields) query.set("tweet.fields", params.tweet_fields as string);
      return twitterFetch(context.serviceConnectionId, `/tweets/search/recent?${query.toString()}`);
    },
  },
  {
    name: "twitter_get_tweet",
    description: "Get a single tweet by ID",
    action: "twitter:get_tweet",
    inputSchema: z.object({
      id: z.string(),
      tweet_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.tweet_fields) query.set("tweet.fields", params.tweet_fields as string);
      const qs = query.toString();
      return twitterFetch(context.serviceConnectionId, `/tweets/${params.id}${qs ? `?${qs}` : ""}`);
    },
  },
  {
    name: "twitter_post_tweet",
    description: "Post a new tweet, optionally with an image attachment",
    action: "twitter:post_tweet",
    inputSchema: z.object({
      text: z.string().max(280),
      reply_to: z.string().optional(),
      quote_tweet_id: z.string().optional(),
      image_url: z.string().optional().describe("Optional image to attach to the tweet — either a URL or a base64 data URI (e.g. data:image/jpeg;base64,...). JPEG, PNG, or GIF, max 5MB."),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = { text: params.text };
      if (params.reply_to) body.reply = { in_reply_to_tweet_id: params.reply_to };
      if (params.quote_tweet_id) body.quote_tweet_id = params.quote_tweet_id;
      if (params.image_url) {
        const image = await downloadImage(params.image_url as string);
        const mediaId = await twitterUploadMedia(
          context.serviceConnectionId,
          image.buffer,
          image.mimeType
        );
        body.media = { media_ids: [mediaId] };
      }
      return twitterFetch(context.serviceConnectionId, "/tweets", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "twitter_delete_tweet",
    description: "Delete a tweet by ID",
    action: "twitter:delete_tweet",
    inputSchema: z.object({
      id: z.string(),
    }),
    handler: async (params, context) => {
      return twitterFetch(context.serviceConnectionId, `/tweets/${params.id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_get_me",
    description: "Get the authenticated user's profile",
    action: "twitter:get_me",
    inputSchema: z.object({
      user_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.user_fields) query.set("user.fields", params.user_fields as string);
      const qs = query.toString();
      return twitterFetch(context.serviceConnectionId, `/users/me${qs ? `?${qs}` : ""}`);
    },
  },
  {
    name: "twitter_get_user",
    description: "Get a user's profile by username",
    action: "twitter:get_user",
    inputSchema: z.object({
      username: z.string(),
      user_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.user_fields) query.set("user.fields", params.user_fields as string);
      const qs = query.toString();
      return twitterFetch(
        context.serviceConnectionId,
        `/users/by/username/${encodeURIComponent(params.username as string)}${qs ? `?${qs}` : ""}`
      );
    },
  },
  {
    name: "twitter_get_user_tweets",
    description: "Get tweets posted by a user",
    action: "twitter:get_user_tweets",
    inputSchema: z.object({
      user_id: z.string(),
      max_results: z.number().min(5).max(100).optional().default(10),
      tweet_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 10),
      });
      if (params.tweet_fields) query.set("tweet.fields", params.tweet_fields as string);
      return twitterFetch(context.serviceConnectionId, `/users/${params.user_id}/tweets?${query.toString()}`);
    },
  },
  {
    name: "twitter_get_user_mentions",
    description: "Get tweets mentioning a user",
    action: "twitter:get_user_mentions",
    inputSchema: z.object({
      user_id: z.string(),
      max_results: z.number().min(5).max(100).optional().default(10),
      tweet_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 10),
      });
      if (params.tweet_fields) query.set("tweet.fields", params.tweet_fields as string);
      return twitterFetch(context.serviceConnectionId, `/users/${params.user_id}/mentions?${query.toString()}`);
    },
  },
  {
    name: "twitter_like_tweet",
    description: "Like a tweet",
    action: "twitter:like_tweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/likes`, {
        method: "POST",
        body: JSON.stringify({ tweet_id: params.tweet_id }),
      });
    },
  },
  {
    name: "twitter_unlike_tweet",
    description: "Unlike a previously liked tweet",
    action: "twitter:unlike_tweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/likes/${params.tweet_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_retweet",
    description: "Retweet a tweet",
    action: "twitter:retweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/retweets`, {
        method: "POST",
        body: JSON.stringify({ tweet_id: params.tweet_id }),
      });
    },
  },
  {
    name: "twitter_unretweet",
    description: "Undo a retweet",
    action: "twitter:unretweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/retweets/${params.tweet_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_get_followers",
    description: "Get a user's followers",
    action: "twitter:get_followers",
    inputSchema: z.object({
      user_id: z.string(),
      max_results: z.number().min(1).max(1000).optional().default(100),
      user_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 100),
      });
      if (params.user_fields) query.set("user.fields", params.user_fields as string);
      return twitterFetch(context.serviceConnectionId, `/users/${params.user_id}/followers?${query.toString()}`);
    },
  },
  {
    name: "twitter_get_following",
    description: "Get users a user is following",
    action: "twitter:get_following",
    inputSchema: z.object({
      user_id: z.string(),
      max_results: z.number().min(1).max(1000).optional().default(100),
      user_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 100),
      });
      if (params.user_fields) query.set("user.fields", params.user_fields as string);
      return twitterFetch(context.serviceConnectionId, `/users/${params.user_id}/following?${query.toString()}`);
    },
  },
  {
    name: "twitter_follow_user",
    description: "Follow a user",
    action: "twitter:follow_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/following`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: params.target_user_id }),
      });
    },
  },
  {
    name: "twitter_unfollow_user",
    description: "Unfollow a user",
    action: "twitter:unfollow_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/following/${params.target_user_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_mute_user",
    description: "Mute a user",
    action: "twitter:mute_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/muting`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: params.target_user_id }),
      });
    },
  },
  {
    name: "twitter_unmute_user",
    description: "Unmute a user",
    action: "twitter:unmute_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/muting/${params.target_user_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_block_user",
    description: "Block a user",
    action: "twitter:block_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/blocking`, {
        method: "POST",
        body: JSON.stringify({ target_user_id: params.target_user_id }),
      });
    },
  },
  {
    name: "twitter_unblock_user",
    description: "Unblock a user",
    action: "twitter:unblock_user",
    inputSchema: z.object({
      target_user_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/blocking/${params.target_user_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_get_bookmarks",
    description: "Get the authenticated user's bookmarked tweets",
    action: "twitter:get_bookmarks",
    inputSchema: z.object({
      max_results: z.number().min(1).max(100).optional().default(20),
      tweet_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 20),
      });
      if (params.tweet_fields) query.set("tweet.fields", params.tweet_fields as string);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/bookmarks?${query.toString()}`);
    },
  },
  {
    name: "twitter_bookmark_tweet",
    description: "Bookmark a tweet",
    action: "twitter:bookmark_tweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/bookmarks`, {
        method: "POST",
        body: JSON.stringify({ tweet_id: params.tweet_id }),
      });
    },
  },
  {
    name: "twitter_unbookmark_tweet",
    description: "Remove a tweet from bookmarks",
    action: "twitter:unbookmark_tweet",
    inputSchema: z.object({
      tweet_id: z.string(),
    }),
    handler: async (params, context) => {
      const userId = await getAuthenticatedUserId(context.serviceConnectionId);
      return twitterFetch(context.serviceConnectionId, `/users/${userId}/bookmarks/${params.tweet_id}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "twitter_send_dm",
    description: "Send a direct message to a user",
    action: "twitter:send_dm",
    inputSchema: z.object({
      participant_id: z.string(),
      text: z.string(),
    }),
    handler: async (params, context) => {
      return twitterFetch(
        context.serviceConnectionId,
        `/dm_conversations/with/${params.participant_id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ text: params.text }),
        }
      );
    },
  },
  {
    name: "twitter_get_dm_events",
    description: "Get recent direct message events",
    action: "twitter:get_dm_events",
    inputSchema: z.object({
      max_results: z.number().min(1).max(100).optional().default(20),
      dm_event_fields: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        max_results: String(params.max_results ?? 20),
      });
      if (params.dm_event_fields) query.set("dm_event.fields", params.dm_event_fields as string);
      return twitterFetch(context.serviceConnectionId, `/dm_events?${query.toString()}`);
    },
  },
];
