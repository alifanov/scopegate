import { z } from 'zod';
import { telegramFetch } from '../telegram';
import type { ToolDefinition } from './types';

export const telegramTools: ToolDefinition[] = [
  // =====================
  // Telegram tools
  // =====================
  {
    name: "telegram_send_message",
    description: "Send a message via Telegram bot",
    action: "telegram:send_message",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
      text: z.string(),
      parse_mode: z.enum(["HTML", "Markdown", "MarkdownV2"]).optional(),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "sendMessage", {
        chat_id: params.chat_id,
        text: params.text,
        ...(params.parse_mode ? { parse_mode: params.parse_mode } : {}),
      });
    },
  },
  {
    name: "telegram_get_updates",
    description: "Get incoming updates for the Telegram bot",
    action: "telegram:get_updates",
    inputSchema: z.object({
      offset: z.number().optional(),
      limit: z.number().min(1).max(100).optional().default(20),
      timeout: z.number().optional().default(0),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "getUpdates", {
        offset: params.offset,
        limit: params.limit,
        timeout: params.timeout,
      });
    },
  },
  {
    name: "telegram_get_chat",
    description: "Get information about a Telegram chat",
    action: "telegram:get_chat",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "getChat", {
        chat_id: params.chat_id,
      });
    },
  },
  {
    name: "telegram_get_chat_members_count",
    description: "Get the number of members in a chat",
    action: "telegram:get_chat_members_count",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "getChatMembersCount", {
        chat_id: params.chat_id,
      });
    },
  },
  {
    name: "telegram_send_photo",
    description: "Send a photo via Telegram bot",
    action: "telegram:send_photo",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
      photo: z.string().describe("URL of the photo"),
      caption: z.string().optional(),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "sendPhoto", {
        chat_id: params.chat_id,
        photo: params.photo,
        ...(params.caption ? { caption: params.caption } : {}),
      });
    },
  },
  {
    name: "telegram_send_document",
    description: "Send a document via Telegram bot",
    action: "telegram:send_document",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
      document: z.string().describe("URL of the document"),
      caption: z.string().optional(),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "sendDocument", {
        chat_id: params.chat_id,
        document: params.document,
        ...(params.caption ? { caption: params.caption } : {}),
      });
    },
  },
  {
    name: "telegram_pin_message",
    description: "Pin a message in a chat",
    action: "telegram:pin_message",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
      message_id: z.number(),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "pinChatMessage", {
        chat_id: params.chat_id,
        message_id: params.message_id,
      });
    },
  },
  {
    name: "telegram_unpin_message",
    description: "Unpin a message in a chat",
    action: "telegram:unpin_message",
    inputSchema: z.object({
      chat_id: z.union([z.string(), z.number()]),
      message_id: z.number().optional(),
    }),
    handler: async (params, context) => {
      return telegramFetch(context.serviceConnectionId, "unpinChatMessage", {
        chat_id: params.chat_id,
        ...(params.message_id ? { message_id: params.message_id } : {}),
      });
    },
  },
];
