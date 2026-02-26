import { z } from "zod";
import { googleCalendarFetch } from "./google-calendar";
import { googleAdsQuery, googleAdsMutate, googleAdsApplyRecommendation, googleAdsDismissRecommendation, getGoogleAdsCustomerId } from "./google-ads";
import { googleSearchConsoleFetch, googleSearchConsoleV1Fetch } from "./google-search-console";
import { openRouterFetch } from "./openrouter";
import { twitterFetch, getAuthenticatedUserId, twitterUploadMedia } from "./twitter";
import { linkedinFetch, getLinkedInMemberUrn, linkedinUploadImage } from "./linkedin";
import { downloadImage } from "./image-utils";

function buildDateCondition(params: Record<string, unknown>): string {
  if (params.dateRangeStart && params.dateRangeEnd) {
    return ` WHERE segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`;
  }
  if (params.datePreset) {
    return ` WHERE segments.date DURING ${params.datePreset}`;
  }
  return " WHERE segments.date DURING LAST_30_DAYS";
}

function buildDateAndCondition(params: Record<string, unknown>): string {
  if (params.dateRangeStart && params.dateRangeEnd) {
    return ` AND segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`;
  }
  if (params.datePreset) {
    return ` AND segments.date DURING ${params.datePreset}`;
  }
  return " AND segments.date DURING LAST_30_DAYS";
}

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
  // Google Ads tools — Read: Campaigns
  {
    name: "googleAds_list_campaigns",
    description: "List campaigns in the Google Ads account",
    action: "googleAds:list_campaigns",
    inputSchema: z.object({
      status: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget FROM campaign`;
      const conditions: string[] = [];
      if (params.status) conditions.push(`campaign.status = '${params.status}'`);
      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
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
    handler: async (params, context) => {
      const query = `SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc, segments.date FROM campaign WHERE campaign.id = ${params.campaignId}${buildDateAndCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Ad Groups
  {
    name: "googleAds_list_ad_groups",
    description: "List ad groups within a campaign",
    action: "googleAds:list_ad_groups",
    inputSchema: z.object({
      campaignId: z.string(),
      status: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.campaign, ad_group.cpc_bid_micros FROM ad_group WHERE ad_group.campaign = 'customers/{cid}/campaigns/${params.campaignId}'`;
      if (params.status) query += ` AND ad_group.status = '${params.status}'`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      query = query.replace("{cid}", cid);
      return googleAdsQuery(context.serviceConnectionId, query);
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
    handler: async (params, context) => {
      const query = `SELECT ad_group.id, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc, segments.date FROM ad_group WHERE ad_group.id = ${params.adGroupId}${buildDateAndCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Ads
  {
    name: "googleAds_list_ads",
    description: "List ads within an ad group",
    action: "googleAds:list_ads",
    inputSchema: z.object({
      adGroupId: z.string(),
      status: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.status, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE ad_group_ad.ad_group = 'customers/{cid}/adGroups/${params.adGroupId}'`;
      if (params.status) query += ` AND ad_group_ad.status = '${params.status}'`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      query = query.replace("{cid}", cid);
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_ad_performance",
    description: "Get performance metrics for a specific ad",
    action: "googleAds:get_ad_performance",
    inputSchema: z.object({
      adGroupId: z.string(),
      adId: z.string(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = `SELECT ad_group_ad.ad.id, ad_group_ad.ad_group, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, segments.date FROM ad_group_ad WHERE ad_group_ad.ad_group = 'customers/{cid}/adGroups/${params.adGroupId}' AND ad_group_ad.ad.id = ${params.adId}${buildDateAndCondition(params)}`;
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsQuery(context.serviceConnectionId, query.replace("{cid}", cid));
    },
  },
  // Google Ads tools — Read: Keywords
  {
    name: "googleAds_list_keywords",
    description: "List keywords in an ad group",
    action: "googleAds:list_keywords",
    inputSchema: z.object({
      adGroupId: z.string(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const query = `SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros FROM ad_group_criterion WHERE ad_group_criterion.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}' AND ad_group_criterion.type = 'KEYWORD' LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
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
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const query = `SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.quality_info.quality_score, segments.date FROM ad_group_criterion WHERE ad_group_criterion.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}' AND ad_group_criterion.criterion_id = ${params.keywordId} AND ad_group_criterion.type = 'KEYWORD'${buildDateAndCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Negative Keywords
  {
    name: "googleAds_list_negative_keywords",
    description:
      "List negative keywords. Provide campaignId for campaign-level negatives, or adGroupId for ad-group-level negatives.",
    action: "googleAds:list_negative_keywords",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      adGroupId: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      if (params.adGroupId) {
        const query = `SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status FROM ad_group_criterion WHERE ad_group_criterion.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}' AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.negative = TRUE LIMIT ${params.maxResults ?? 50}`;
        return googleAdsQuery(context.serviceConnectionId, query);
      }
      if (params.campaignId) {
        const query = `SELECT campaign_criterion.criterion_id, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign_criterion.campaign = 'customers/${cid}/campaigns/${params.campaignId}' AND campaign_criterion.type = 'KEYWORD' AND campaign_criterion.negative = TRUE LIMIT ${params.maxResults ?? 50}`;
        return googleAdsQuery(context.serviceConnectionId, query);
      }
      throw new Error("Either campaignId or adGroupId is required");
    },
  },
  {
    name: "googleAds_get_search_terms_report",
    description: "Get search terms report showing actual queries that triggered ads",
    action: "googleAds:get_search_terms_report",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      adGroupId: z.string().optional(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
      maxResults: z.number().optional().default(100),
    }),
    handler: async (params, context) => {
      let query = `SELECT search_term_view.search_term, search_term_view.ad_group, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, segments.date FROM search_term_view WHERE segments.date DURING LAST_30_DAYS`;
      if (params.dateRangeStart && params.dateRangeEnd) {
        query = query.replace("segments.date DURING LAST_30_DAYS", `segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`);
      } else if (params.datePreset) {
        query = query.replace("segments.date DURING LAST_30_DAYS", `segments.date DURING ${params.datePreset}`);
      }
      if (params.campaignId) query += ` AND campaign.id = ${params.campaignId}`;
      if (params.adGroupId) query += ` AND ad_group.id = ${params.adGroupId}`;
      query += ` LIMIT ${params.maxResults ?? 100}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Account
  {
    name: "googleAds_get_account_overview",
    description: "Get an overview of the Google Ads account performance",
    action: "googleAds:get_account_overview",
    inputSchema: z.object({
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = `SELECT customer.id, customer.descriptive_name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, metrics.average_cpc, segments.date FROM customer${buildDateCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Audiences
  {
    name: "googleAds_list_audiences",
    description: "List audiences configured in the Google Ads account",
    action: "googleAds:list_audiences",
    inputSchema: z.object({
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const query = `SELECT audience.id, audience.name, audience.description, audience.status FROM audience LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_audience_performance",
    description: "Get performance metrics for a specific audience segment",
    action: "googleAds:get_audience_performance",
    inputSchema: z.object({
      audienceId: z.string(),
      campaignId: z.string().optional(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      let query = `SELECT campaign_audience_view.resource_name, metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros, segments.date FROM campaign_audience_view WHERE campaign_audience_view.resource_name LIKE '%${params.audienceId}%'`;
      if (params.campaignId) query += ` AND campaign.id = ${params.campaignId}`;
      query += buildDateAndCondition(params);
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Conversions
  {
    name: "googleAds_list_conversions",
    description: "List conversion actions configured in the account",
    action: "googleAds:list_conversions",
    inputSchema: z.object({
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const query = `SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.status, conversion_action.category FROM conversion_action LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_conversion_performance",
    description: "Get conversion performance metrics",
    action: "googleAds:get_conversion_performance",
    inputSchema: z.object({
      conversionActionId: z.string().optional(),
      campaignId: z.string().optional(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      let query = `SELECT conversion_action.id, conversion_action.name, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion, segments.date FROM conversion_action`;
      const conditions: string[] = [];
      if (params.conversionActionId) conditions.push(`conversion_action.id = ${params.conversionActionId}`);
      if (params.campaignId) conditions.push(`campaign.id = ${params.campaignId}`);
      if (params.dateRangeStart && params.dateRangeEnd) {
        conditions.push(`segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`);
      } else if (params.datePreset) {
        conditions.push(`segments.date DURING ${params.datePreset}`);
      } else {
        conditions.push("segments.date DURING LAST_30_DAYS");
      }
      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Extensions
  {
    name: "googleAds_list_extensions",
    description: "List ad extensions (sitelinks, callouts, structured snippets, etc.)",
    action: "googleAds:list_extensions",
    inputSchema: z.object({
      type: z.string().optional(),
      campaignId: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT asset.id, asset.type, asset.name, asset.sitelink_asset, asset.callout_asset, asset.structured_snippet_asset FROM asset`;
      const conditions: string[] = [];
      if (params.type) conditions.push(`asset.type = '${params.type}'`);
      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Budgets & Bidding
  {
    name: "googleAds_list_budgets",
    description: "List campaign budgets",
    action: "googleAds:list_budgets",
    inputSchema: z.object({
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const query = `SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.status, campaign_budget.total_amount_micros FROM campaign_budget LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_budget_details",
    description: "Get details for a specific campaign budget",
    action: "googleAds:get_budget_details",
    inputSchema: z.object({
      budgetId: z.string(),
    }),
    handler: async (params, context) => {
      const query = `SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.status, campaign_budget.total_amount_micros, campaign_budget.period, campaign_budget.explicitly_shared FROM campaign_budget WHERE campaign_budget.id = ${params.budgetId}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_list_bid_strategies",
    description: "List bidding strategies in the account",
    action: "googleAds:list_bid_strategies",
    inputSchema: z.object({
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const query = `SELECT bidding_strategy.id, bidding_strategy.name, bidding_strategy.type, bidding_strategy.status FROM bidding_strategy LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_bid_strategy_performance",
    description: "Get performance metrics for a specific bidding strategy",
    action: "googleAds:get_bid_strategy_performance",
    inputSchema: z.object({
      bidStrategyId: z.string(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = `SELECT bidding_strategy.id, bidding_strategy.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, segments.date FROM bidding_strategy WHERE bidding_strategy.id = ${params.bidStrategyId}${buildDateAndCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Recommendations
  {
    name: "googleAds_list_recommendations",
    description: "List Google Ads optimization recommendations",
    action: "googleAds:list_recommendations",
    inputSchema: z.object({
      type: z.string().optional(),
      campaignId: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT recommendation.resource_name, recommendation.type, recommendation.impact, recommendation.campaign FROM recommendation`;
      const conditions: string[] = [];
      if (params.type) conditions.push(`recommendation.type = '${params.type}'`);
      if (params.campaignId) conditions.push(`recommendation.campaign = 'customers/{cid}/campaigns/${params.campaignId}'`);
      if (conditions.length > 0) {
        const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
        query += ` WHERE ${conditions.join(" AND ")}`.replace("{cid}", cid);
      }
      query += ` LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Change History
  {
    name: "googleAds_get_change_history",
    description: "Get change history for the account showing recent modifications",
    action: "googleAds:get_change_history",
    inputSchema: z.object({
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      resourceType: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT change_event.change_date_time, change_event.change_resource_type, change_event.resource_name, change_event.old_resource, change_event.new_resource, change_event.user_email FROM change_event`;
      const conditions: string[] = [];
      if (params.dateRangeStart && params.dateRangeEnd) {
        conditions.push(`change_event.change_date_time >= '${params.dateRangeStart}' AND change_event.change_date_time <= '${params.dateRangeEnd}'`);
      }
      if (params.resourceType) conditions.push(`change_event.change_resource_type = '${params.resourceType}'`);
      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      query += ` ORDER BY change_event.change_date_time DESC LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Labels
  {
    name: "googleAds_list_labels",
    description: "List labels in the Google Ads account",
    action: "googleAds:list_labels",
    inputSchema: z.object({
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const query = `SELECT label.id, label.name, label.description, label.status FROM label LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Assets
  {
    name: "googleAds_list_assets",
    description: "List assets (images, texts, videos, etc.) in the account",
    action: "googleAds:list_assets",
    inputSchema: z.object({
      type: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT asset.id, asset.type, asset.name, asset.final_urls FROM asset`;
      if (params.type) query += ` WHERE asset.type = '${params.type}'`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_list_asset_groups",
    description: "List asset groups for Performance Max campaigns",
    action: "googleAds:list_asset_groups",
    inputSchema: z.object({
      campaignId: z.string(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const query = `SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.campaign FROM asset_group WHERE asset_group.campaign = 'customers/${cid}/campaigns/${params.campaignId}' LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Read: Geo & Device Performance
  {
    name: "googleAds_get_geo_performance",
    description: "Get performance metrics broken down by geographic location",
    action: "googleAds:get_geo_performance",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
      maxResults: z.number().optional().default(50),
    }),
    handler: async (params, context) => {
      let query = `SELECT geographic_view.country_criterion_id, geographic_view.location_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, segments.date FROM geographic_view`;
      const conditions: string[] = [];
      if (params.campaignId) conditions.push(`campaign.id = ${params.campaignId}`);
      if (params.dateRangeStart && params.dateRangeEnd) {
        conditions.push(`segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`);
      } else if (params.datePreset) {
        conditions.push(`segments.date DURING ${params.datePreset}`);
      } else {
        conditions.push("segments.date DURING LAST_30_DAYS");
      }
      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      query += ` LIMIT ${params.maxResults ?? 50}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  {
    name: "googleAds_get_device_performance",
    description: "Get performance metrics broken down by device type",
    action: "googleAds:get_device_performance",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      dateRangeStart: z.string().optional(),
      dateRangeEnd: z.string().optional(),
      datePreset: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = `SELECT segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.ctr, segments.date FROM campaign${params.campaignId ? ` WHERE campaign.id = ${params.campaignId}` : ""}${params.campaignId ? buildDateAndCondition(params) : buildDateCondition(params)}`;
      return googleAdsQuery(context.serviceConnectionId, query);
    },
  },
  // Google Ads tools — Write: Campaigns
  {
    name: "googleAds_create_campaign",
    description: "Create a new campaign in Google Ads",
    action: "googleAds:create_campaign",
    inputSchema: z.object({
      name: z.string(),
      type: z.string(),
      status: z.string().optional().default("PAUSED"),
      budgetId: z.string(),
      biddingStrategyType: z.string().optional(),
      targetCpa: z.number().optional(),
      targetRoas: z.number().optional(),
      networkSettings: z.object({
        targetGoogleSearch: z.boolean().optional(),
        targetSearchNetwork: z.boolean().optional(),
        targetContentNetwork: z.boolean().optional(),
      }).optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const campaign: Record<string, unknown> = {
        name: params.name,
        advertisingChannelType: params.type,
        status: params.status ?? "PAUSED",
        campaignBudget: `customers/${cid}/campaignBudgets/${params.budgetId}`,
      };
      if (params.networkSettings) {
        campaign.networkSettings = params.networkSettings;
      }
      if (params.biddingStrategyType) {
        campaign.biddingStrategyType = params.biddingStrategyType;
      }
      if (params.targetCpa !== undefined) {
        campaign.targetCpa = { targetCpaMicros: params.targetCpa };
      }
      if (params.targetRoas !== undefined) {
        campaign.targetRoas = { targetRoas: params.targetRoas };
      }
      return googleAdsMutate(context.serviceConnectionId, "campaigns", [
        { create: campaign },
      ]);
    },
  },
  {
    name: "googleAds_update_campaign",
    description: "Update an existing campaign's settings",
    action: "googleAds:update_campaign",
    inputSchema: z.object({
      campaignId: z.string(),
      name: z.string().optional(),
      status: z.string().optional(),
      budgetId: z.string().optional(),
      biddingStrategyType: z.string().optional(),
      targetCpa: z.number().optional(),
      targetRoas: z.number().optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const campaign: Record<string, unknown> = {
        resourceName: `customers/${cid}/campaigns/${params.campaignId}`,
      };
      const updateMask: string[] = [];
      if (params.name) { campaign.name = params.name; updateMask.push("name"); }
      if (params.status) { campaign.status = params.status; updateMask.push("status"); }
      if (params.budgetId) { campaign.campaignBudget = `customers/${cid}/campaignBudgets/${params.budgetId}`; updateMask.push("campaign_budget"); }
      if (params.biddingStrategyType) { campaign.biddingStrategyType = params.biddingStrategyType; updateMask.push("bidding_strategy_type"); }
      if (params.targetCpa !== undefined) { campaign.targetCpa = { targetCpaMicros: params.targetCpa }; updateMask.push("target_cpa"); }
      if (params.targetRoas !== undefined) { campaign.targetRoas = { targetRoas: params.targetRoas }; updateMask.push("target_roas"); }
      return googleAdsMutate(context.serviceConnectionId, "campaigns", [
        { update: campaign, updateMask: updateMask.join(",") },
      ]);
    },
  },
  {
    name: "googleAds_pause_campaign",
    description: "Pause a running campaign",
    action: "googleAds:pause_campaign",
    inputSchema: z.object({
      campaignId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "campaigns", [
        {
          update: {
            resourceName: `customers/${cid}/campaigns/${params.campaignId}`,
            status: "PAUSED",
          },
          updateMask: "status",
        },
      ]);
    },
  },
  {
    name: "googleAds_enable_campaign",
    description: "Enable a paused campaign",
    action: "googleAds:enable_campaign",
    inputSchema: z.object({
      campaignId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "campaigns", [
        {
          update: {
            resourceName: `customers/${cid}/campaigns/${params.campaignId}`,
            status: "ENABLED",
          },
          updateMask: "status",
        },
      ]);
    },
  },
  // Google Ads tools — Write: Ad Groups
  {
    name: "googleAds_create_ad_group",
    description: "Create a new ad group within a campaign",
    action: "googleAds:create_ad_group",
    inputSchema: z.object({
      campaignId: z.string(),
      name: z.string(),
      status: z.string().optional().default("PAUSED"),
      cpcBidMicros: z.number().optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const adGroup: Record<string, unknown> = {
        name: params.name,
        campaign: `customers/${cid}/campaigns/${params.campaignId}`,
        status: params.status ?? "PAUSED",
      };
      if (params.cpcBidMicros !== undefined) {
        adGroup.cpcBidMicros = String(params.cpcBidMicros);
      }
      return googleAdsMutate(context.serviceConnectionId, "adGroups", [
        { create: adGroup },
      ]);
    },
  },
  {
    name: "googleAds_update_ad_group",
    description: "Update an existing ad group's settings",
    action: "googleAds:update_ad_group",
    inputSchema: z.object({
      adGroupId: z.string(),
      name: z.string().optional(),
      status: z.string().optional(),
      cpcBidMicros: z.number().optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const adGroup: Record<string, unknown> = {
        resourceName: `customers/${cid}/adGroups/${params.adGroupId}`,
      };
      const updateMask: string[] = [];
      if (params.name) { adGroup.name = params.name; updateMask.push("name"); }
      if (params.status) { adGroup.status = params.status; updateMask.push("status"); }
      if (params.cpcBidMicros !== undefined) { adGroup.cpcBidMicros = String(params.cpcBidMicros); updateMask.push("cpc_bid_micros"); }
      return googleAdsMutate(context.serviceConnectionId, "adGroups", [
        { update: adGroup, updateMask: updateMask.join(",") },
      ]);
    },
  },
  {
    name: "googleAds_pause_ad_group",
    description: "Pause an ad group",
    action: "googleAds:pause_ad_group",
    inputSchema: z.object({
      adGroupId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "adGroups", [
        {
          update: {
            resourceName: `customers/${cid}/adGroups/${params.adGroupId}`,
            status: "PAUSED",
          },
          updateMask: "status",
        },
      ]);
    },
  },
  // Google Ads tools — Write: Ads
  {
    name: "googleAds_create_ad",
    description: "Create a new responsive search ad in an ad group",
    action: "googleAds:create_ad",
    inputSchema: z.object({
      adGroupId: z.string(),
      headlines: z.array(z.string()).min(3).max(15),
      descriptions: z.array(z.string()).min(2).max(4),
      finalUrls: z.array(z.string()),
      path1: z.string().optional(),
      path2: z.string().optional(),
      status: z.string().optional().default("PAUSED"),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const headlines = (params.headlines as string[]).map((text: string) => ({ text }));
      const descriptions = (params.descriptions as string[]).map((text: string) => ({ text }));
      const adGroupAd: Record<string, unknown> = {
        adGroup: `customers/${cid}/adGroups/${params.adGroupId}`,
        status: params.status ?? "PAUSED",
        ad: {
          finalUrls: params.finalUrls,
          responsiveSearchAd: {
            headlines,
            descriptions,
            path1: params.path1 ?? "",
            path2: params.path2 ?? "",
          },
        },
      };
      return googleAdsMutate(context.serviceConnectionId, "adGroupAds", [
        { create: adGroupAd },
      ]);
    },
  },
  {
    name: "googleAds_update_ad",
    description: "Update an existing ad",
    action: "googleAds:update_ad",
    inputSchema: z.object({
      adGroupId: z.string(),
      adId: z.string(),
      status: z.string().optional(),
      headlines: z.array(z.string()).optional(),
      descriptions: z.array(z.string()).optional(),
      finalUrls: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const adGroupAd: Record<string, unknown> = {
        resourceName: `customers/${cid}/adGroupAds/${params.adGroupId}~${params.adId}`,
      };
      const updateMask: string[] = [];
      if (params.status) { adGroupAd.status = params.status; updateMask.push("status"); }
      if (params.headlines) {
        const headlines = (params.headlines as string[]).map((text: string) => ({ text }));
        adGroupAd.ad = { ...((adGroupAd.ad as Record<string, unknown>) ?? {}), responsiveSearchAd: { headlines } };
        updateMask.push("ad.responsive_search_ad.headlines");
      }
      if (params.descriptions) {
        const descriptions = (params.descriptions as string[]).map((text: string) => ({ text }));
        const existingAd = (adGroupAd.ad as Record<string, unknown>) ?? {};
        const existingRsa = (existingAd.responsiveSearchAd as Record<string, unknown>) ?? {};
        adGroupAd.ad = { ...existingAd, responsiveSearchAd: { ...existingRsa, descriptions } };
        updateMask.push("ad.responsive_search_ad.descriptions");
      }
      if (params.finalUrls) {
        const existingAd = (adGroupAd.ad as Record<string, unknown>) ?? {};
        adGroupAd.ad = { ...existingAd, finalUrls: params.finalUrls };
        updateMask.push("ad.final_urls");
      }
      return googleAdsMutate(context.serviceConnectionId, "adGroupAds", [
        { update: adGroupAd, updateMask: updateMask.join(",") },
      ]);
    },
  },
  {
    name: "googleAds_pause_ad",
    description: "Pause an ad",
    action: "googleAds:pause_ad",
    inputSchema: z.object({
      adGroupId: z.string(),
      adId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "adGroupAds", [
        {
          update: {
            resourceName: `customers/${cid}/adGroupAds/${params.adGroupId}~${params.adId}`,
            status: "PAUSED",
          },
          updateMask: "status",
        },
      ]);
    },
  },
  // Google Ads tools — Write: Keywords
  {
    name: "googleAds_add_keyword",
    description: "Add a keyword to an ad group",
    action: "googleAds:add_keyword",
    inputSchema: z.object({
      adGroupId: z.string(),
      text: z.string(),
      matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
      cpcBidMicros: z.number().optional(),
      status: z.string().optional().default("ENABLED"),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const criterion: Record<string, unknown> = {
        adGroup: `customers/${cid}/adGroups/${params.adGroupId}`,
        keyword: {
          text: params.text,
          matchType: params.matchType,
        },
        status: params.status ?? "ENABLED",
      };
      if (params.cpcBidMicros !== undefined) {
        criterion.cpcBidMicros = String(params.cpcBidMicros);
      }
      return googleAdsMutate(context.serviceConnectionId, "adGroupCriteria", [
        { create: criterion },
      ]);
    },
  },
  {
    name: "googleAds_remove_keyword",
    description: "Remove a keyword from an ad group",
    action: "googleAds:remove_keyword",
    inputSchema: z.object({
      adGroupId: z.string(),
      keywordId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "adGroupCriteria", [
        { remove: `customers/${cid}/adGroupCriteria/${params.adGroupId}~${params.keywordId}` },
      ]);
    },
  },
  {
    name: "googleAds_update_keyword_bid",
    description: "Update the CPC bid for a keyword",
    action: "googleAds:update_keyword_bid",
    inputSchema: z.object({
      adGroupId: z.string(),
      keywordId: z.string(),
      cpcBidMicros: z.number(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "adGroupCriteria", [
        {
          update: {
            resourceName: `customers/${cid}/adGroupCriteria/${params.adGroupId}~${params.keywordId}`,
            cpcBidMicros: String(params.cpcBidMicros),
          },
          updateMask: "cpc_bid_micros",
        },
      ]);
    },
  },
  // Google Ads tools — Write: Negative Keywords
  {
    name: "googleAds_add_negative_keyword",
    description:
      "Add a negative keyword. Provide campaignId for campaign-level or adGroupId for ad-group-level negative keyword.",
    action: "googleAds:add_negative_keyword",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      adGroupId: z.string().optional(),
      text: z.string(),
      matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      if (params.adGroupId) {
        return googleAdsMutate(context.serviceConnectionId, "adGroupCriteria", [
          {
            create: {
              adGroup: `customers/${cid}/adGroups/${params.adGroupId}`,
              negative: true,
              keyword: {
                text: params.text,
                matchType: params.matchType,
              },
              status: "ENABLED",
            },
          },
        ]);
      }
      if (params.campaignId) {
        return googleAdsMutate(
          context.serviceConnectionId,
          "campaignCriteria",
          [
            {
              create: {
                campaign: `customers/${cid}/campaigns/${params.campaignId}`,
                negative: true,
                keyword: {
                  text: params.text,
                  matchType: params.matchType,
                },
              },
            },
          ]
        );
      }
      throw new Error("Either campaignId or adGroupId is required");
    },
  },
  {
    name: "googleAds_remove_negative_keyword",
    description:
      "Remove a negative keyword. Provide campaignId for campaign-level or adGroupId for ad-group-level.",
    action: "googleAds:remove_negative_keyword",
    inputSchema: z.object({
      campaignId: z.string().optional(),
      adGroupId: z.string().optional(),
      keywordId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      if (params.adGroupId) {
        return googleAdsMutate(context.serviceConnectionId, "adGroupCriteria", [
          {
            remove: `customers/${cid}/adGroupCriteria/${params.adGroupId}~${params.keywordId}`,
          },
        ]);
      }
      if (params.campaignId) {
        return googleAdsMutate(
          context.serviceConnectionId,
          "campaignCriteria",
          [
            {
              remove: `customers/${cid}/campaignCriteria/${params.campaignId}~${params.keywordId}`,
            },
          ]
        );
      }
      throw new Error("Either campaignId or adGroupId is required");
    },
  },
  // Google Ads tools — Write: Budgets
  {
    name: "googleAds_update_budget",
    description: "Update a campaign budget amount",
    action: "googleAds:update_budget",
    inputSchema: z.object({
      budgetId: z.string(),
      amountMicros: z.number(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "campaignBudgets", [
        {
          update: {
            resourceName: `customers/${cid}/campaignBudgets/${params.budgetId}`,
            amountMicros: String(params.amountMicros),
          },
          updateMask: "amount_micros",
        },
      ]);
    },
  },
  // Google Ads tools — Write: Recommendations
  {
    name: "googleAds_apply_recommendation",
    description: "Apply a Google Ads optimization recommendation",
    action: "googleAds:apply_recommendation",
    inputSchema: z.object({
      recommendationId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsApplyRecommendation(context.serviceConnectionId, [
        { resourceName: `customers/${cid}/recommendations/${params.recommendationId}` },
      ]);
    },
  },
  {
    name: "googleAds_dismiss_recommendation",
    description: "Dismiss a Google Ads optimization recommendation",
    action: "googleAds:dismiss_recommendation",
    inputSchema: z.object({
      recommendationId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsDismissRecommendation(context.serviceConnectionId, [
        { resourceName: `customers/${cid}/recommendations/${params.recommendationId}` },
      ]);
    },
  },
  // Google Ads tools — Write: Labels
  {
    name: "googleAds_create_label",
    description: "Create a new label for organizing campaigns, ad groups, or ads",
    action: "googleAds:create_label",
    inputSchema: z.object({
      name: z.string(),
      description: z.string().optional(),
      backgroundColor: z.string().optional(),
    }),
    handler: async (params, context) => {
      const label: Record<string, unknown> = {
        name: params.name,
      };
      if (params.description) label.description = params.description;
      if (params.backgroundColor) {
        label.textLabel = { backgroundColor: params.backgroundColor };
      }
      return googleAdsMutate(context.serviceConnectionId, "labels", [
        { create: label },
      ]);
    },
  },
  {
    name: "googleAds_assign_label",
    description: "Assign a label to a campaign, ad group, or ad",
    action: "googleAds:assign_label",
    inputSchema: z.object({
      labelId: z.string(),
      resourceType: z.enum(["campaign", "adGroup", "ad"]),
      resourceId: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const resourceType = params.resourceType as string;
      const resourceId = params.resourceId as string;
      const labelId = params.labelId as string;

      const resourceMap: Record<string, { mutateResource: string; field: string; resourcePath: string }> = {
        campaign: { mutateResource: "campaignLabels", field: "campaign", resourcePath: `customers/${cid}/campaigns/${resourceId}` },
        adGroup: { mutateResource: "adGroupLabels", field: "adGroup", resourcePath: `customers/${cid}/adGroups/${resourceId}` },
        ad: { mutateResource: "adGroupAdLabels", field: "adGroupAd", resourcePath: `customers/${cid}/adGroupAds/${resourceId}` },
      };

      const config = resourceMap[resourceType];
      if (!config) throw new Error(`Invalid resource type: ${resourceType}`);

      return googleAdsMutate(context.serviceConnectionId, config.mutateResource, [
        {
          create: {
            [config.field]: config.resourcePath,
            label: `customers/${cid}/labels/${labelId}`,
          },
        },
      ]);
    },
  },
  // Google Search Console tools
  {
    name: "searchConsole_list_sites",
    description: "List all sites verified in Google Search Console",
    action: "searchConsole:list_sites",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        "/sites"
      );
    },
  },
  {
    name: "searchConsole_get_site",
    description: "Get details about a specific site in Google Search Console",
    action: "searchConsole:get_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`
      );
    },
  },
  {
    name: "searchConsole_add_site",
    description: "Add a site to Google Search Console",
    action: "searchConsole:add_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`,
        { method: "PUT" }
      );
    },
  },
  {
    name: "searchConsole_delete_site",
    description: "Remove a site from Google Search Console",
    action: "searchConsole:delete_site",
    inputSchema: z.object({
      siteUrl: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}`,
        { method: "DELETE" }
      );
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
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const body: Record<string, unknown> = {
        startDate: params.startDate,
        endDate: params.endDate,
      };
      if (params.dimensions) body.dimensions = params.dimensions;
      if (params.rowLimit) body.rowLimit = params.rowLimit;
      if (params.dimensionFilterGroups) body.dimensionFilterGroups = params.dimensionFilterGroups;
      if (params.type) body.type = params.type;

      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/searchAnalytics/query`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
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
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        inspectionUrl: params.inspectionUrl,
        siteUrl: params.siteUrl,
      };
      if (params.languageCode) body.languageCode = params.languageCode;

      return googleSearchConsoleV1Fetch(
        context.serviceConnectionId,
        "/urlInspection/index:inspect",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "searchConsole_list_sitemaps",
    description: "List sitemaps submitted for a site",
    action: "searchConsole:list_sitemaps",
    inputSchema: z.object({
      siteUrl: z.string(),
      sitemapIndex: z.string().optional(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const query = params.sitemapIndex
        ? `?sitemapIndex=${encodeURIComponent(params.sitemapIndex as string)}`
        : "";
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps${query}`
      );
    },
  },
  {
    name: "searchConsole_get_sitemap",
    description: "Get details about a specific sitemap",
    action: "searchConsole:get_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`
      );
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
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
        { method: "PUT" }
      );
    },
  },
  {
    name: "searchConsole_delete_sitemap",
    description: "Delete a sitemap from Google Search Console",
    action: "searchConsole:delete_sitemap",
    inputSchema: z.object({
      siteUrl: z.string(),
      feedpath: z.string(),
    }),
    handler: async (params, context) => {
      const encodedSiteUrl = encodeURIComponent(params.siteUrl as string);
      const encodedFeedpath = encodeURIComponent(params.feedpath as string);
      return googleSearchConsoleFetch(
        context.serviceConnectionId,
        `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
        { method: "DELETE" }
      );
    },
  },
  // OpenRouter tools
  {
    name: "openRouter_chat_completion",
    description: "Send a chat completion request to an AI model via OpenRouter",
    action: "openRouter:chat_completion",
    inputSchema: z.object({
      model: z.string(),
      messages: z.array(
        z.object({
          role: z.string(),
          content: z.string(),
        })
      ),
      temperature: z.number().optional(),
      max_tokens: z.number().optional(),
      top_p: z.number().optional(),
      stream: z.literal(false).optional(),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        "/chat/completions",
        {
          method: "POST",
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            stream: false,
          }),
        }
      );
    },
  },
  {
    name: "openRouter_get_generation",
    description: "Get metadata for a specific generation by ID",
    action: "openRouter:get_generation",
    inputSchema: z.object({
      id: z.string(),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        `/generation?id=${encodeURIComponent(params.id as string)}`
      );
    },
  },
  {
    name: "openRouter_list_models",
    description: "List all available AI models on OpenRouter",
    action: "openRouter:list_models",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/models");
    },
  },
  {
    name: "openRouter_get_model_endpoints",
    description: "Get available endpoints for a specific model",
    action: "openRouter:get_model_endpoints",
    inputSchema: z.object({
      author: z.string(),
      slug: z.string(),
    }),
    handler: async (params, context) => {
      const author = encodeURIComponent(params.author as string);
      const slug = encodeURIComponent(params.slug as string);
      return openRouterFetch(
        context.serviceConnectionId,
        `/models/${author}/${slug}/endpoints`
      );
    },
  },
  {
    name: "openRouter_get_key_info",
    description: "Get API key details including daily, weekly, and monthly spend",
    action: "openRouter:get_key_info",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/key");
    },
  },
  {
    name: "openRouter_get_credits",
    description: "Get account credits and total usage",
    action: "openRouter:get_credits",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/credits");
    },
  },
  {
    name: "openRouter_get_activity",
    description: "Get usage metrics per model and day",
    action: "openRouter:get_activity",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/activity");
    },
  },
  {
    name: "openRouter_list_providers",
    description: "List all AI model providers on OpenRouter",
    action: "openRouter:list_providers",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return openRouterFetch(context.serviceConnectionId, "/providers");
    },
  },
  {
    name: "openRouter_create_embeddings",
    description: "Generate vector embeddings using an AI model",
    action: "openRouter:create_embeddings",
    inputSchema: z.object({
      model: z.string(),
      input: z.union([z.string(), z.array(z.string())]),
    }),
    handler: async (params, context) => {
      return openRouterFetch(
        context.serviceConnectionId,
        "/embeddings",
        {
          method: "POST",
          body: JSON.stringify({
            model: params.model,
            input: params.input,
          }),
        }
      );
    },
  },
  // LinkedIn tools
  {
    name: "linkedin_get_profile",
    description: "Get the authenticated LinkedIn user's profile (name, email, picture)",
    action: "linkedin:get_profile",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return linkedinFetch(context.serviceConnectionId, "/userinfo", { useV2: true });
    },
  },
  {
    name: "linkedin_create_post",
    description: "Create a new LinkedIn post (text, with link, or with image)",
    action: "linkedin:create_post",
    inputSchema: z.object({
      text: z.string().describe("The text content of the post"),
      link: z.string().url().optional().describe("Optional URL to share with the post"),
      image_url: z.string().url().optional().describe("Optional image URL to attach to the post (JPEG, PNG, or GIF, max 5MB). Cannot be used together with link."),
    }),
    handler: async (params, context) => {
      if (params.link && params.image_url) {
        throw new Error("Cannot use both 'link' and 'image_url' — LinkedIn posts support one content type at a time.");
      }
      const authorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const body: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        visibility: "PUBLIC",
        commentary: params.text as string,
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
      };
      if (params.link) {
        body.content = {
          article: {
            source: params.link,
          },
        };
      } else if (params.image_url) {
        const image = await downloadImage(params.image_url as string);
        const imageUrn = await linkedinUploadImage(
          context.serviceConnectionId,
          image.buffer,
          image.mimeType
        );
        body.content = {
          media: {
            id: imageUrn,
          },
        };
      }
      return linkedinFetch(context.serviceConnectionId, "/posts", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "linkedin_delete_post",
    description: "Delete a LinkedIn post by its URN",
    action: "linkedin:delete_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to delete (e.g. urn:li:share:123456)"),
    }),
    handler: async (params, context) => {
      const encodedUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(context.serviceConnectionId, `/posts/${encodedUrn}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "linkedin_get_post",
    description: "Get a LinkedIn post by its URN",
    action: "linkedin:get_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post (e.g. urn:li:share:123456)"),
    }),
    handler: async (params, context) => {
      const encodedUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(context.serviceConnectionId, `/posts/${encodedUrn}`);
    },
  },
  {
    name: "linkedin_like_post",
    description: "Like (react to) a LinkedIn post",
    action: "linkedin:like_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to like"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const body = {
        root: params.post_urn,
        reactionType: "LIKE",
        actor: actorUrn,
      };
      return linkedinFetch(context.serviceConnectionId, "/reactions", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "linkedin_unlike_post",
    description: "Remove a like (reaction) from a LinkedIn post",
    action: "linkedin:unlike_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to unlike"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const encodedActorUrn = encodeURIComponent(actorUrn);
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      return linkedinFetch(
        context.serviceConnectionId,
        `/reactions/${encodedPostUrn}?actor=${encodedActorUrn}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "linkedin_comment_on_post",
    description: "Add a comment to a LinkedIn post",
    action: "linkedin:comment_on_post",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post to comment on"),
      text: z.string().describe("The comment text"),
    }),
    handler: async (params, context) => {
      const actorUrn = await getLinkedInMemberUrn(context.serviceConnectionId);
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      const body = {
        actor: actorUrn,
        object: params.post_urn,
        message: {
          text: params.text,
        },
      };
      return linkedinFetch(
        context.serviceConnectionId,
        `/socialActions/${encodedPostUrn}/comments`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
  },
  {
    name: "linkedin_get_post_comments",
    description: "Get comments on a LinkedIn post",
    action: "linkedin:get_post_comments",
    inputSchema: z.object({
      post_urn: z.string().describe("The URN of the post"),
      count: z.number().min(1).max(100).optional().default(10).describe("Number of comments to return"),
      start: z.number().optional().default(0).describe("Offset for pagination"),
    }),
    handler: async (params, context) => {
      const encodedPostUrn = encodeURIComponent(params.post_urn as string);
      const query = new URLSearchParams({
        count: String(params.count ?? 10),
        start: String(params.start ?? 0),
      });
      return linkedinFetch(
        context.serviceConnectionId,
        `/socialActions/${encodedPostUrn}/comments?${query.toString()}`
      );
    },
  },
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
      image_url: z.string().url().optional().describe("Optional image URL to attach to the tweet (JPEG, PNG, or GIF, max 5MB)"),
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

export function getToolsByActions(actions: string[]): ToolDefinition[] {
  const actionSet = new Set(actions);
  return TOOL_DEFINITIONS.filter((t) => actionSet.has(t.action));
}
