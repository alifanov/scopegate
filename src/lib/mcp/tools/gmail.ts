import { z } from 'zod';
import {
  gmailFetch,
  listGmailMessages,
  listGmailAttachments,
  getGmailAttachment,
  buildRawEmail,
} from '../gmail';
import type { ToolDefinition } from './types';

export const gmailTools: ToolDefinition[] = [
  // Gmail tools
  {
    name: "gmail_read_emails",
    description: "Read emails from Gmail inbox",
    action: "gmail:read_emails",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
      query: z.string().optional(),
    }),
    handler: async (params, context) => {
      return listGmailMessages(
        context.serviceConnectionId,
        (params.maxResults as number) ?? 10,
        params.query as string | undefined
      );
    },
  },
  {
    name: "gmail_send_email",
    description: "Send an email via Gmail",
    action: "gmail:send_email",
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
    handler: async (params, context) => {
      const raw = buildRawEmail(
        params.to as string,
        params.subject as string,
        params.body as string
      );
      return gmailFetch(context.serviceConnectionId, "/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw }),
      });
    },
  },
  {
    name: "gmail_list_labels",
    description: "List Gmail labels",
    action: "gmail:list_labels",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return gmailFetch(context.serviceConnectionId, "/users/me/labels");
    },
  },
  {
    name: "gmail_list_attachments",
    description: "List attachments (filename, type, size) of a Gmail message",
    action: "gmail:list_attachments",
    inputSchema: z.object({
      messageId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid message ID format"),
    }),
    handler: async (params, context) => {
      return listGmailAttachments(
        context.serviceConnectionId,
        params.messageId as string
      );
    },
  },
  {
    name: "gmail_get_attachment",
    description: "Download a Gmail attachment's content as base64",
    action: "gmail:get_attachment",
    inputSchema: z.object({
      messageId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid message ID format"),
      attachmentId: z.string().regex(/^[a-zA-Z0-9_=-]+$/, "Invalid attachment ID format"),
    }),
    handler: async (params, context) => {
      return getGmailAttachment(
        context.serviceConnectionId,
        params.messageId as string,
        params.attachmentId as string
      );
    },
  },
  {
    name: "gmail_search_emails",
    description: "Search emails in Gmail",
    action: "gmail:search_emails",
    inputSchema: z.object({
      query: z.string(),
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      return listGmailMessages(
        context.serviceConnectionId,
        (params.maxResults as number) ?? 10,
        params.query as string
      );
    },
  },
];
