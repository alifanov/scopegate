import { z } from 'zod';
import { googleCalendarFetch } from '../google-calendar';
import type { ToolDefinition } from './types';

export const calendarTools: ToolDefinition[] = [
  // Calendar tools
  {
    name: "calendar_list_events",
    description: "List upcoming calendar events",
    action: "calendar:list_events",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
      timeMin: z.string().optional(),
      timeMax: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        maxResults: String(params.maxResults ?? 10),
        orderBy: "startTime",
        singleEvents: "true",
        timeMin: (params.timeMin as string) || new Date().toISOString(),
      });
      if (params.timeMax) query.set("timeMax", params.timeMax as string);

      return googleCalendarFetch(
        context.serviceConnectionId,
        `/calendars/primary/events?${query.toString()}`
      );
    },
  },
  {
    name: "calendar_create_event",
    description: "Create a new calendar event",
    action: "calendar:create_event",
    inputSchema: z.object({
      summary: z.string(),
      start: z.string(),
      end: z.string(),
      description: z.string().optional(),
      timeZone: z.string().optional(),
    }),
    handler: async (params, context) => {
      const timeZone = (params.timeZone as string) || "UTC";
      const body = {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start, timeZone },
        end: { dateTime: params.end, timeZone },
      };

      return googleCalendarFetch(
        context.serviceConnectionId,
        "/calendars/primary/events",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "calendar_update_event",
    description: "Update an existing calendar event",
    action: "calendar:update_event",
    inputSchema: z.object({
      eventId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid event ID format"),
      summary: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      description: z.string().optional(),
      timeZone: z.string().optional(),
    }),
    handler: async (params, context) => {
      const { eventId, ...fields } = params;
      const timeZone = (fields.timeZone as string) || "UTC";
      const body: Record<string, unknown> = {};
      if (fields.summary) body.summary = fields.summary;
      if (fields.description) body.description = fields.description;
      if (fields.start) body.start = { dateTime: fields.start, timeZone };
      if (fields.end) body.end = { dateTime: fields.end, timeZone };

      return googleCalendarFetch(
        context.serviceConnectionId,
        `/calendars/primary/events/${eventId}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "calendar_delete_event",
    description: "Delete a calendar event",
    action: "calendar:delete_event",
    inputSchema: z.object({
      eventId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid event ID format"),
    }),
    handler: async (params, context) => {
      return googleCalendarFetch(
        context.serviceConnectionId,
        `/calendars/primary/events/${params.eventId}`,
        { method: "DELETE" }
      );
    },
  },
];
