import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const calendlyTools: ToolDefinition[] = [
  // =====================
  // Calendly tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "calendly_get_current_user",
    description: "Get the current Calendly user",
    action: "calendly:get_current_user",
    inputSchema: z.object({}),
    path: "/users/me",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "calendly_list_event_types",
    description: "List Calendly event types",
    action: "calendly:list_event_types",
    inputSchema: z.object({
      user: z.string().describe("User URI from /users/me"),
      count: z.number().min(1).max(100).optional().default(20),
    }),
    path: "/event_types",
    query: (params) => ({ user: params.user as string, count: (params.count as number) ?? 20 }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "calendly_list_scheduled_events",
    description: "List scheduled Calendly events",
    action: "calendly:list_scheduled_events",
    inputSchema: z.object({
      user: z.string().describe("User URI"),
      count: z.number().min(1).max(100).optional().default(20),
      status: z.enum(["active", "canceled"]).optional().default("active"),
    }),
    path: "/scheduled_events",
    query: (params) => ({
      user: params.user as string,
      count: (params.count as number) ?? 20,
      status: (params.status as string) || "active",
    }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "calendly_get_event",
    description: "Get a specific Calendly event",
    action: "calendly:get_event",
    inputSchema: z.object({
      eventUuid: z.string(),
    }),
    path: (params) => `/scheduled_events/${params.eventUuid}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "calendly_list_invitees",
    description: "List invitees for a Calendly event",
    action: "calendly:list_invitees",
    inputSchema: z.object({
      eventUuid: z.string(),
      count: z.number().min(1).max(100).optional().default(20),
    }),
    path: (params) => `/scheduled_events/${params.eventUuid}/invitees`,
    query: (params) => ({ count: (params.count as number) ?? 20 }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "calendly_cancel_event",
    description: "Cancel a Calendly event",
    action: "calendly:cancel_event",
    inputSchema: z.object({
      eventUuid: z.string(),
      reason: z.string().optional(),
    }),
    path: (params) => `/scheduled_events/${params.eventUuid}/cancellation`,
    method: "POST",
    body: (params) => ({ reason: params.reason }),
  }),
];
