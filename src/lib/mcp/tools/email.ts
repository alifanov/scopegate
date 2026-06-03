import { z } from 'zod';
import {
  emailListMailboxes,
  emailListMessages,
  emailReadMessage,
  emailSearchMessages,
  emailSendMessage,
  emailMoveMessage,
  emailDeleteMessage,
  emailMarkRead,
} from '../email';
import type { ToolDefinition } from './types';

export const emailTools: ToolDefinition[] = [
  // Email (IMAP/SMTP) tools
  {
    name: "email_list_mailboxes",
    description: "List all email mailboxes/folders (e.g. INBOX, Sent, Drafts, Trash)",
    action: "email:list_mailboxes",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return emailListMailboxes(context.serviceConnectionId);
    },
  },
  {
    name: "email_list_messages",
    description: "List email messages in a mailbox, newest first. Returns envelope data (subject, from, to, date) without the full body.",
    action: "email:list_messages",
    inputSchema: z.object({
      mailbox: z.string().default("INBOX").describe("Mailbox/folder path (e.g. INBOX, Sent, Trash)"),
      limit: z.number().optional().default(20).describe("Max messages to return (default 20)"),
      page: z.number().optional().default(1).describe("Page number for pagination"),
    }),
    handler: async (params, context) => {
      return emailListMessages(
        context.serviceConnectionId,
        params.mailbox as string,
        params.limit as number,
        params.page as number
      );
    },
  },
  {
    name: "email_read_message",
    description: "Read the full content of an email message by UID, including text and HTML body",
    action: "email:read_message",
    inputSchema: z.object({
      mailbox: z.string().default("INBOX").describe("Mailbox/folder path"),
      uid: z.number().describe("Message UID (from list_messages or search_messages)"),
    }),
    handler: async (params, context) => {
      return emailReadMessage(
        context.serviceConnectionId,
        params.mailbox as string,
        params.uid as number
      );
    },
  },
  {
    name: "email_search_messages",
    description: "Search email messages by criteria (from, to, subject, body, date range, read/unread status)",
    action: "email:search_messages",
    inputSchema: z.object({
      mailbox: z.string().default("INBOX").describe("Mailbox/folder path"),
      from: z.string().optional().describe("Filter by sender address or name"),
      to: z.string().optional().describe("Filter by recipient address or name"),
      subject: z.string().optional().describe("Filter by subject text"),
      body: z.string().optional().describe("Filter by body text"),
      since: z.string().optional().describe("Messages since date (ISO format, e.g. 2025-01-01)"),
      before: z.string().optional().describe("Messages before date (ISO format)"),
      unseen: z.boolean().optional().describe("Only show unread messages"),
      flagged: z.boolean().optional().describe("Only show flagged/starred messages"),
      limit: z.number().optional().default(20).describe("Max results to return"),
    }),
    handler: async (params, context) => {
      const { mailbox, limit, ...query } = params;
      return emailSearchMessages(
        context.serviceConnectionId,
        mailbox as string,
        query,
        limit as number
      );
    },
  },
  {
    name: "email_send_message",
    description: "Send a new email message via SMTP",
    action: "email:send_message",
    inputSchema: z.object({
      to: z.string().email().describe("Recipient email address(es), comma-separated for multiple"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      cc: z.string().email().optional().describe("CC recipients, comma-separated"),
      bcc: z.string().email().optional().describe("BCC recipients, comma-separated"),
      html: z.boolean().optional().default(false).describe("If true, body is treated as HTML"),
    }),
    handler: async (params, context) => {
      return emailSendMessage(
        context.serviceConnectionId,
        params.to as string,
        params.subject as string,
        params.body as string,
        {
          cc: params.cc as string | undefined,
          bcc: params.bcc as string | undefined,
          html: params.html as boolean | undefined,
        }
      );
    },
  },
  {
    name: "email_reply_message",
    description: "Reply to an email message. Reads the original message to set proper In-Reply-To and References headers.",
    action: "email:reply_message",
    inputSchema: z.object({
      mailbox: z.string().default("INBOX").describe("Mailbox where the original message is"),
      uid: z.number().describe("UID of the message to reply to"),
      body: z.string().describe("Reply body content"),
      html: z.boolean().optional().default(false).describe("If true, body is treated as HTML"),
      replyAll: z.boolean().optional().default(false).describe("If true, reply to all recipients"),
    }),
    handler: async (params, context) => {
      // First read the original message to get headers
      const original = await emailReadMessage(
        context.serviceConnectionId,
        params.mailbox as string,
        params.uid as number
      );

      if (!original) throw new Error("Message not found");
      const envelope = original.envelope as Record<string, unknown>;
      const from = (envelope.from as Array<{ address: string; name?: string }>)?.[0];
      const to = (envelope.to as Array<{ address: string; name?: string }>) || [];
      const subject = (envelope.subject as string) || "";
      const messageId = envelope.messageId as string | undefined;

      const replyTo = from?.address || "";
      const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;

      let ccAddresses: string | undefined;
      if (params.replyAll) {
        const cc = (envelope.cc as Array<{ address: string }>) || [];
        const allRecipients = [...to, ...cc]
          .map((a) => a.address)
          .filter((a) => a !== replyTo);
        if (allRecipients.length > 0) {
          ccAddresses = allRecipients.join(", ");
        }
      }

      return emailSendMessage(
        context.serviceConnectionId,
        replyTo,
        replySubject,
        params.body as string,
        {
          html: params.html as boolean | undefined,
          cc: ccAddresses,
          inReplyTo: messageId,
          references: messageId,
        }
      );
    },
  },
  {
    name: "email_move_message",
    description: "Move an email message to a different mailbox/folder",
    action: "email:move_message",
    inputSchema: z.object({
      mailbox: z.string().describe("Source mailbox/folder path"),
      uid: z.number().describe("Message UID to move"),
      destination: z.string().describe("Destination mailbox/folder path (e.g. Trash, Archive)"),
    }),
    handler: async (params, context) => {
      return emailMoveMessage(
        context.serviceConnectionId,
        params.mailbox as string,
        params.uid as number,
        params.destination as string
      );
    },
  },
  {
    name: "email_delete_message",
    description: "Permanently delete an email message",
    action: "email:delete_message",
    inputSchema: z.object({
      mailbox: z.string().describe("Mailbox/folder path"),
      uid: z.number().describe("Message UID to delete"),
    }),
    handler: async (params, context) => {
      return emailDeleteMessage(
        context.serviceConnectionId,
        params.mailbox as string,
        params.uid as number
      );
    },
  },
  {
    name: "email_mark_read",
    description: "Mark an email message as read or unread",
    action: "email:mark_read",
    inputSchema: z.object({
      mailbox: z.string().describe("Mailbox/folder path"),
      uid: z.number().describe("Message UID"),
      seen: z.boolean().describe("true = mark as read, false = mark as unread"),
    }),
    handler: async (params, context) => {
      return emailMarkRead(
        context.serviceConnectionId,
        params.mailbox as string,
        params.uid as number,
        params.seen as boolean
      );
    },
  },
];
