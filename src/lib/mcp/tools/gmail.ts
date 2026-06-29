import { z } from 'zod';
import { gmailFetch, listGmailMessages, buildRawEmail } from '../gmail';
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
