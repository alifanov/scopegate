import { z } from "zod";
import { googleCalendarFetch } from "./google-calendar";

export interface ToolContext {
  serviceConnectionId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  action: string;
  inputSchema: z.ZodType;
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

// Tool definitions mapped to permission actions
// Each tool only executes if the endpoint has the corresponding permission
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Gmail tools
  {
    name: "gmail_read_emails",
    description: "Read emails from Gmail inbox",
    action: "gmail:read_emails",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
      query: z.string().optional(),
    }),
    handler: async (params) => {
      // TODO: Implement with googleapis
      return { messages: [], note: "Gmail API not yet connected", params };
    },
  },
  {
    name: "gmail_send_email",
    description: "Send an email via Gmail",
    action: "gmail:send_email",
    inputSchema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
    handler: async (params) => {
      return { success: false, note: "Gmail API not yet connected", params };
    },
  },
  {
    name: "gmail_list_labels",
    description: "List Gmail labels",
    action: "gmail:list_labels",
    inputSchema: z.object({}),
    handler: async () => {
      return { labels: [], note: "Gmail API not yet connected" };
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
    handler: async (params) => {
      return { messages: [], note: "Gmail API not yet connected", params };
    },
  },
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
      });
      if (params.timeMin) query.set("timeMin", params.timeMin as string);
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
    }),
    handler: async (params, context) => {
      const body = {
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start },
        end: { dateTime: params.end },
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
      eventId: z.string(),
      summary: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      description: z.string().optional(),
    }),
    handler: async (params, context) => {
      const { eventId, ...fields } = params;
      const body: Record<string, unknown> = {};
      if (fields.summary) body.summary = fields.summary;
      if (fields.description) body.description = fields.description;
      if (fields.start) body.start = { dateTime: fields.start };
      if (fields.end) body.end = { dateTime: fields.end };

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
      eventId: z.string(),
    }),
    handler: async (params, context) => {
      return googleCalendarFetch(
        context.serviceConnectionId,
        `/calendars/primary/events/${params.eventId}`,
        { method: "DELETE" }
      );
    },
  },
  // Drive tools
  {
    name: "drive_list_files",
    description: "List files in Google Drive",
    action: "drive:list_files",
    inputSchema: z.object({
      query: z.string().optional(),
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params) => {
      return { files: [], note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_read_file",
    description: "Read contents of a Google Drive file",
    action: "drive:read_file",
    inputSchema: z.object({
      fileId: z.string(),
    }),
    handler: async (params) => {
      return { content: null, note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_create_file",
    description: "Create a new file in Google Drive",
    action: "drive:create_file",
    inputSchema: z.object({
      name: z.string(),
      content: z.string(),
      mimeType: z.string().optional(),
    }),
    handler: async (params) => {
      return { success: false, note: "Drive API not yet connected", params };
    },
  },
  {
    name: "drive_delete_file",
    description: "Delete a file from Google Drive",
    action: "drive:delete_file",
    inputSchema: z.object({
      fileId: z.string(),
    }),
    handler: async (params) => {
      return { success: false, note: "Drive API not yet connected", params };
    },
  },
  // Google Ads tools
  {
    name: "googleAds_list_campaigns",
    description: "List campaigns in the Google Ads account",
    action: "googleAds:list_campaigns",
    inputSchema: z.object({
      status: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params) => {
      return { campaigns: [], note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_get_campaign_performance",
    description: "Get performance metrics for a specific campaign",
    action: "googleAds:get_campaign_performance",
    inputSchema: z.object({
      campaignId: z.string(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params) => {
      return { performance: null, note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_list_ad_groups",
    description: "List ad groups within a campaign",
    action: "googleAds:list_ad_groups",
    inputSchema: z.object({
      campaignId: z.string(),
      status: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params) => {
      return { adGroups: [], note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_get_ad_group_performance",
    description: "Get performance metrics for a specific ad group",
    action: "googleAds:get_ad_group_performance",
    inputSchema: z.object({
      adGroupId: z.string(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params) => {
      return { performance: null, note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_list_keywords",
    description: "List keywords in an ad group",
    action: "googleAds:list_keywords",
    inputSchema: z.object({
      adGroupId: z.string(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params) => {
      return { keywords: [], note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_get_keyword_performance",
    description: "Get performance metrics for a specific keyword",
    action: "googleAds:get_keyword_performance",
    inputSchema: z.object({
      adGroupId: z.string(),
      keywordId: z.string(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params) => {
      return { performance: null, note: "Google Ads API not yet connected", params };
    },
  },
  {
    name: "googleAds_get_account_overview",
    description: "Get an overview of the Google Ads account performance",
    action: "googleAds:get_account_overview",
    inputSchema: z.object({
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params) => {
      return { overview: null, note: "Google Ads API not yet connected", params };
    },
  },
  // Google Search Console tools
  {
    name: "searchConsole_list_sites",
    description: "List all sites verified in Google Search Console",
    action: "searchConsole:list_sites",
    inputSchema: z.object({}),
    handler: async () => {
      return { sites: [], note: "Search Console API not yet connected" };
    },
  },
  {
    name: "searchConsole_query_analytics",
    description: "Query search analytics data for a site",
    action: "searchConsole:query_analytics",
    inputSchema: z.object({
      siteUrl: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      dimensions: z.array(z.string()).optional(),
      rowLimit: z.number().optional().default(1000),
      dimensionFilterGroups: z.array(z.object({
        filters: z.array(z.object({
          dimension: z.string(),
          operator: z.string(),
          expression: z.string(),
        })),
      })).optional(),
      type: z.string().optional(),
    }),
    handler: async (params) => {
      return { rows: [], note: "Search Console API not yet connected", params };
    },
  },
  {
    name: "searchConsole_inspect_url",
    description: "Inspect a URL in Google Search Console",
    action: "searchConsole:inspect_url",
    inputSchema: z.object({
      inspectionUrl: z.string(),
      siteUrl: z.string(),
      languageCode: z.string().optional(),
    }),
    handler: async (params) => {
      return { result: null, note: "Search Console API not yet connected", params };
    },
  },
  {
    name: "searchConsole_list_sitemaps",
    description: "List sitemaps submitted for a site",
    action: "searchConsole:list_sitemaps",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params) => {
      return { sitemaps: [], note: "Search Console API not yet connected", params };
    },
  },
  {
    name: "searchConsole_submit_sitemap",
    description: "Submit a sitemap for a site",
    action: "searchConsole:submit_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params) => {
      return { success: false, note: "Search Console API not yet connected", params };
    },
  },
];

export function getToolsByActions(actions: string[]): ToolDefinition[] {
  const actionSet = new Set(actions);
  return TOOL_DEFINITIONS.filter((t) => actionSet.has(t.action));
}
