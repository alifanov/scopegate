import { z } from 'zod';
import { calendlyFetch } from '../calendly';
import type { ToolDefinition } from './types';

export const calendlyTools: ToolDefinition[] = [
  // =====================
  // Calendly tools
  // =====================
  {
    name: "calendly_get_current_user",
    description: "Get the current Calendly user",
    action: "calendly:get_current_user",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return calendlyFetch(context.serviceConnectionId, "/users/me");
    },
  },
  {
    name: "calendly_list_event_types",
    description: "List Calendly event types",
    action: "calendly:list_event_types",
    inputSchema: z.object({
      user: z.string().describe("User URI from /users/me"),
      count: z.number().min(1).max(100).optional().default(20),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        user: params.user as string,
        count: String(params.count ?? 20),
      });
      return calendlyFetch(context.serviceConnectionId, `/event_types?${query.toString()}`);
    },
  },
  {
    name: "calendly_list_scheduled_events",
    description: "List scheduled Calendly events",
    action: "calendly:list_scheduled_events",
    inputSchema: z.object({
      user: z.string().describe("User URI"),
      count: z.number().min(1).max(100).optional().default(20),
      status: z.enum(["active", "canceled"]).optional().default("active"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        user: params.user as string,
        count: String(params.count ?? 20),
        status: (params.status as string) || "active",
      });
      return calendlyFetch(context.serviceConnectionId, `/scheduled_events?${query.toString()}`);
    },
  },
  {
    name: "calendly_get_event",
    description: "Get a specific Calendly event",
    action: "calendly:get_event",
    inputSchema: z.object({
      eventUuid: z.string(),
    }),
    handler: async (params, context) => {
      return calendlyFetch(context.serviceConnectionId, `/scheduled_events/${params.eventUuid}`);
    },
  },
  {
    name: "calendly_list_invitees",
    description: "List invitees for a Calendly event",
    action: "calendly:list_invitees",
    inputSchema: z.object({
      eventUuid: z.string(),
      count: z.number().min(1).max(100).optional().default(20),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ count: String(params.count ?? 20) });
      return calendlyFetch(context.serviceConnectionId, `/scheduled_events/${params.eventUuid}/invitees?${query.toString()}`);
    },
  },
  {
    name: "calendly_cancel_event",
    description: "Cancel a Calendly event",
    action: "calendly:cancel_event",
    inputSchema: z.object({
      eventUuid: z.string(),
      reason: z.string().optional(),
    }),
    handler: async (params, context) => {
      return calendlyFetch(context.serviceConnectionId, `/scheduled_events/${params.eventUuid}/cancellation`, {
        method: "POST",
        body: JSON.stringify({ reason: params.reason }),
      });
    },
  },
];
