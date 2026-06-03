import { z } from 'zod';
import { slackFetch } from '../slack';
import type { ToolDefinition } from './types';

export const slackTools: ToolDefinition[] = [
  // =====================
  // Slack tools
  // =====================
  {
    name: "slack_list_channels",
    description: "List Slack channels in the workspace",
    action: "slack:list_channels",
    inputSchema: z.object({
      limit: z.number().min(1).max(1000).optional().default(100),
      types: z.string().optional().default("public_channel"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "conversations.list", {
        limit: params.limit,
        types: params.types,
      });
    },
  },
  {
    name: "slack_post_message",
    description: "Post a message to a Slack channel",
    action: "slack:post_message",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      text: z.string(),
      thread_ts: z.string().optional().describe("Thread timestamp to reply to"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "chat.postMessage", {
        channel: params.channel,
        text: params.text,
        ...(params.thread_ts ? { thread_ts: params.thread_ts } : {}),
      });
    },
  },
  {
    name: "slack_get_channel_history",
    description: "Get message history from a Slack channel",
    action: "slack:get_channel_history",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      limit: z.number().min(1).max(1000).optional().default(20),
      oldest: z.string().optional().describe("Start of time range (Unix timestamp)"),
      latest: z.string().optional().describe("End of time range (Unix timestamp)"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "conversations.history", {
        channel: params.channel,
        limit: params.limit,
        ...(params.oldest ? { oldest: params.oldest } : {}),
        ...(params.latest ? { latest: params.latest } : {}),
      });
    },
  },
  {
    name: "slack_get_user_info",
    description: "Get information about a Slack user",
    action: "slack:get_user_info",
    inputSchema: z.object({
      user: z.string().describe("User ID"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "users.info", {
        user: params.user,
      });
    },
  },
  {
    name: "slack_add_reaction",
    description: "Add a reaction emoji to a message",
    action: "slack:add_reaction",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      timestamp: z.string().describe("Message timestamp"),
      name: z.string().describe("Emoji name without colons (e.g. 'thumbsup')"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "reactions.add", {
        channel: params.channel,
        timestamp: params.timestamp,
        name: params.name,
      });
    },
  },
  {
    name: "slack_remove_reaction",
    description: "Remove a reaction emoji from a message",
    action: "slack:remove_reaction",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      timestamp: z.string().describe("Message timestamp"),
      name: z.string().describe("Emoji name without colons"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "reactions.remove", {
        channel: params.channel,
        timestamp: params.timestamp,
        name: params.name,
      });
    },
  },
  {
    name: "slack_list_users",
    description: "List users in the Slack workspace",
    action: "slack:list_users",
    inputSchema: z.object({
      limit: z.number().min(1).max(1000).optional().default(100),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "users.list", {
        limit: params.limit,
      });
    },
  },
  {
    name: "slack_upload_file",
    description: "Share a file or text snippet in a Slack channel",
    action: "slack:upload_file",
    inputSchema: z.object({
      channel: z.string().describe("Channel ID"),
      content: z.string().describe("Text content of the file"),
      filename: z.string().optional(),
      title: z.string().optional(),
      filetype: z.string().optional().describe("File type (e.g. 'text', 'python', 'json')"),
    }),
    handler: async (params, context) => {
      return slackFetch(context.serviceConnectionId, "files.upload", {
        channels: params.channel,
        content: params.content,
        filename: params.filename,
        title: params.title,
        filetype: params.filetype,
      });
    },
  },
];
