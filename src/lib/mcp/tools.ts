import { z } from "zod";
import { googleCalendarFetch } from "./google-calendar";
import { googleAdsQuery, googleAdsMutate, googleAdsApplyRecommendation, googleAdsDismissRecommendation, getGoogleAdsCustomerId } from "./google-ads";
import { googleSearchConsoleFetch, googleSearchConsoleV1Fetch } from "./google-search-console";
import { googleTagManagerFetch } from "./google-tag-manager";
import { openRouterFetch } from "./openrouter";
import { twitterFetch, getAuthenticatedUserId, twitterUploadMedia } from "./twitter";
import { linkedinFetch, getLinkedInMemberUrn, linkedinUploadImage } from "./linkedin";
import { downloadImage } from "./image-utils";
import { slackFetch } from "./slack";
import { notionFetch } from "./notion";
import { hubspotFetch } from "./hubspot";
import { githubFetch } from "./github";
import { jiraFetch } from "./jira";
import { salesforceFetch } from "./salesforce";
import { metaAdsFetch } from "./meta-ads";
import { twitterAdsFetch } from "./twitter-ads";
import { telegramFetch } from "./telegram";
import { semrushFetch } from "./semrush";
import { ahrefsFetch } from "./ahrefs";
import { stripeFetch } from "./stripe";
import { airtableFetch } from "./airtable";
import { calendlyFetch } from "./calendly";
import { youtubeFetch, youtubeUploadVideo } from "./youtube";
import { threadsFetch } from "./threads";
import {
  emailListMailboxes,
  emailListMessages,
  emailReadMessage,
  emailSearchMessages,
  emailSendMessage,
  emailMoveMessage,
  emailDeleteMessage,
  emailMarkRead,
} from "./email";

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
      // conversion metrics must be queried from campaign/customer resource, not conversion_action
      const fromResource = params.campaignId ? "campaign" : "customer";
      let query = `SELECT segments.conversion_action, segments.conversion_action_name, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion, segments.date FROM ${fromResource}`;
      const conditions: string[] = [];
      if (params.conversionActionId) conditions.push(`segments.conversion_action = 'customers/{cid}/conversionActions/${params.conversionActionId}'`);
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
      cpcBidMicros: z.coerce.number().optional(),
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
      cpcBidMicros: z.coerce.number().optional(),
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
      cpcBidMicros: z.coerce.number().optional(),
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
      cpcBidMicros: z.coerce.number(),
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
      const recId = params.recommendationId as string;
      const resourceName = recId.startsWith("customers/")
        ? recId
        : `customers/${cid}/recommendations/${recId}`;
      return googleAdsApplyRecommendation(context.serviceConnectionId, [
        { resourceName },
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
      const recId = params.recommendationId as string;
      const resourceName = recId.startsWith("customers/")
        ? recId
        : `customers/${cid}/recommendations/${recId}`;
      return googleAdsDismissRecommendation(context.serviceConnectionId, [
        { resourceName },
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
  // Google Ads tools — Write: Extensions (Sitelinks & Callouts)
  {
    name: "googleAds_create_sitelink",
    description: "Create a sitelink extension and link it to a campaign or account",
    action: "googleAds:create_sitelink",
    inputSchema: z.object({
      linkText: z.string().describe("Sitelink link text (max 25 chars)"),
      finalUrl: z.string().describe("Destination URL"),
      description1: z.string().optional().describe("First description line (max 35 chars)"),
      description2: z.string().optional().describe("Second description line (max 35 chars)"),
      campaignId: z.string().optional().describe("Link to this campaign. If omitted, links to account level."),
      name: z.string().optional().describe("Internal asset name for reference"),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const sitelinkAsset: Record<string, unknown> = { linkText: params.linkText };
      if (params.description1) sitelinkAsset.description1 = params.description1;
      if (params.description2) sitelinkAsset.description2 = params.description2;
      const createResult = await googleAdsMutate(context.serviceConnectionId, "assets", [
        {
          create: {
            name: params.name ?? params.linkText,
            type: "SITELINK",
            finalUrls: [params.finalUrl],
            sitelinkAsset,
          },
        },
      ]) as { results?: Array<{ resourceName: string }> };
      const assetResourceName = createResult.results?.[0]?.resourceName;
      if (!assetResourceName) throw new Error("Failed to create sitelink asset");
      if (params.campaignId) {
        await googleAdsMutate(context.serviceConnectionId, "campaignAssets", [
          { create: { campaign: `customers/${cid}/campaigns/${params.campaignId}`, asset: assetResourceName, fieldType: "SITELINK" } },
        ]);
      } else {
        await googleAdsMutate(context.serviceConnectionId, "customerAssets", [
          { create: { asset: assetResourceName, fieldType: "SITELINK" } },
        ]);
      }
      return { assetResourceName, message: "Sitelink created and linked successfully" };
    },
  },
  {
    name: "googleAds_create_callout",
    description: "Create a callout extension and link it to a campaign or account",
    action: "googleAds:create_callout",
    inputSchema: z.object({
      calloutText: z.string().describe("Callout text (max 25 chars)"),
      campaignId: z.string().optional().describe("Link to this campaign. If omitted, links to account level."),
      name: z.string().optional().describe("Internal asset name for reference"),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const createResult = await googleAdsMutate(context.serviceConnectionId, "assets", [
        {
          create: {
            name: params.name ?? params.calloutText,
            type: "CALLOUT",
            calloutAsset: { calloutText: params.calloutText },
          },
        },
      ]) as { results?: Array<{ resourceName: string }> };
      const assetResourceName = createResult.results?.[0]?.resourceName;
      if (!assetResourceName) throw new Error("Failed to create callout asset");
      if (params.campaignId) {
        await googleAdsMutate(context.serviceConnectionId, "campaignAssets", [
          { create: { campaign: `customers/${cid}/campaigns/${params.campaignId}`, asset: assetResourceName, fieldType: "CALLOUT" } },
        ]);
      } else {
        await googleAdsMutate(context.serviceConnectionId, "customerAssets", [
          { create: { asset: assetResourceName, fieldType: "CALLOUT" } },
        ]);
      }
      return { assetResourceName, message: "Callout created and linked successfully" };
    },
  },
  {
    name: "googleAds_update_sitelink",
    description: "Update a sitelink asset's text, descriptions, or URL",
    action: "googleAds:update_sitelink",
    inputSchema: z.object({
      assetId: z.string(),
      linkText: z.string().optional(),
      description1: z.string().optional(),
      description2: z.string().optional(),
      finalUrl: z.string().optional(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      const sitelinkAsset: Record<string, unknown> = {};
      const maskFields: string[] = [];
      if (params.linkText !== undefined) { sitelinkAsset.linkText = params.linkText; maskFields.push("sitelink_asset.link_text"); }
      if (params.description1 !== undefined) { sitelinkAsset.description1 = params.description1; maskFields.push("sitelink_asset.description1"); }
      if (params.description2 !== undefined) { sitelinkAsset.description2 = params.description2; maskFields.push("sitelink_asset.description2"); }
      const updateObj: Record<string, unknown> = {
        resourceName: `customers/${cid}/assets/${params.assetId}`,
        sitelinkAsset,
      };
      if (params.finalUrl !== undefined) { updateObj.finalUrls = [params.finalUrl]; maskFields.push("final_urls"); }
      if (maskFields.length === 0) throw new Error("At least one field to update is required");
      return googleAdsMutate(context.serviceConnectionId, "assets", [
        { update: updateObj, updateMask: maskFields.join(",") },
      ]);
    },
  },
  {
    name: "googleAds_update_callout",
    description: "Update a callout asset's text",
    action: "googleAds:update_callout",
    inputSchema: z.object({
      assetId: z.string(),
      calloutText: z.string(),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      return googleAdsMutate(context.serviceConnectionId, "assets", [
        {
          update: {
            resourceName: `customers/${cid}/assets/${params.assetId}`,
            calloutAsset: { calloutText: params.calloutText },
          },
          updateMask: "callout_asset.callout_text",
        },
      ]);
    },
  },
  {
    name: "googleAds_remove_extension",
    description: "Remove (unlink) a sitelink or callout extension from a campaign or account",
    action: "googleAds:remove_extension",
    inputSchema: z.object({
      assetId: z.string(),
      fieldType: z.enum(["SITELINK", "CALLOUT"]),
      campaignId: z.string().optional().describe("Remove from this campaign. If omitted, removes from account level."),
    }),
    handler: async (params, context) => {
      const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
      if (params.campaignId) {
        return googleAdsMutate(context.serviceConnectionId, "campaignAssets", [
          { remove: `customers/${cid}/campaignAssets/${params.campaignId}~${params.assetId}~${params.fieldType}` },
        ]);
      }
      return googleAdsMutate(context.serviceConnectionId, "customerAssets", [
        { remove: `customers/${cid}/customerAssets/${params.assetId}~${params.fieldType}` },
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
      image_url: z.string().optional().describe("Optional image to attach to the post — either a URL or a base64 data URI (e.g. data:image/jpeg;base64,...). JPEG, PNG, or GIF, max 5MB. Cannot be used together with link."),
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
      image_url: z.string().optional().describe("Optional image to attach to the tweet — either a URL or a base64 data URI (e.g. data:image/jpeg;base64,...). JPEG, PNG, or GIF, max 5MB."),
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
  // =====================
  // Notion tools
  // =====================
  {
    name: "notion_search",
    description: "Search across all pages and databases in Notion",
    action: "notion:search",
    inputSchema: z.object({
      query: z.string().optional(),
      filter: z.object({ value: z.enum(["page", "database"]), property: z.literal("object") }).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/search", {
        method: "POST",
        body: JSON.stringify({ query: params.query, filter: params.filter, page_size: params.page_size }),
      });
    },
  },
  {
    name: "notion_get_page",
    description: "Get a Notion page by ID",
    action: "notion:get_page",
    inputSchema: z.object({ page_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/pages/${params.page_id}`);
    },
  },
  {
    name: "notion_create_page",
    description: "Create a new page in Notion",
    action: "notion:create_page",
    inputSchema: z.object({
      parent: z.object({ database_id: z.string().optional(), page_id: z.string().optional() }),
      properties: z.record(z.string(), z.unknown()),
      children: z.array(z.unknown()).optional(),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/pages", {
        method: "POST",
        body: JSON.stringify({ parent: params.parent, properties: params.properties, children: params.children }),
      });
    },
  },
  {
    name: "notion_update_page",
    description: "Update properties of a Notion page",
    action: "notion:update_page",
    inputSchema: z.object({
      page_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
      archived: z.boolean().optional(),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/pages/${params.page_id}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: params.properties, archived: params.archived }),
      });
    },
  },
  {
    name: "notion_get_database",
    description: "Get a Notion database by ID",
    action: "notion:get_database",
    inputSchema: z.object({ database_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/databases/${params.database_id}`);
    },
  },
  {
    name: "notion_query_database",
    description: "Query a Notion database with optional filter and sort",
    action: "notion:query_database",
    inputSchema: z.object({
      database_id: z.string(),
      filter: z.record(z.string(), z.unknown()).optional(),
      sorts: z.array(z.unknown()).optional(),
      page_size: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/databases/${params.database_id}/query`, {
        method: "POST",
        body: JSON.stringify({ filter: params.filter, sorts: params.sorts, page_size: params.page_size }),
      });
    },
  },
  {
    name: "notion_create_database_item",
    description: "Create a new item (page) in a Notion database",
    action: "notion:create_database_item",
    inputSchema: z.object({
      database_id: z.string(),
      properties: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, "/pages", {
        method: "POST",
        body: JSON.stringify({ parent: { database_id: params.database_id }, properties: params.properties }),
      });
    },
  },
  {
    name: "notion_get_block_children",
    description: "Get the content blocks of a Notion page or block",
    action: "notion:get_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ page_size: String(params.page_size ?? 50) });
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}/children?${query.toString()}`);
    },
  },
  {
    name: "notion_append_block_children",
    description: "Append content blocks to a Notion page or block",
    action: "notion:append_block_children",
    inputSchema: z.object({
      block_id: z.string(),
      children: z.array(z.unknown()),
    }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: params.children }),
      });
    },
  },
  {
    name: "notion_delete_block",
    description: "Delete (archive) a Notion block",
    action: "notion:delete_block",
    inputSchema: z.object({ block_id: z.string() }),
    handler: async (params, context) => {
      return notionFetch(context.serviceConnectionId, `/blocks/${params.block_id}`, { method: "DELETE" });
    },
  },
  {
    name: "notion_list_users",
    description: "List all users in the Notion workspace",
    action: "notion:list_users",
    inputSchema: z.object({
      page_size: z.number().min(1).max(100).optional().default(50),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ page_size: String(params.page_size ?? 50) });
      return notionFetch(context.serviceConnectionId, `/users?${query.toString()}`);
    },
  },
  // =====================
  // HubSpot tools
  // =====================
  {
    name: "hubspot_list_contacts",
    description: "List contacts in HubSpot CRM",
    action: "hubspot:list_contacts",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional().describe("Comma-separated property names"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.properties) query.set("properties", params.properties as string);
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/contacts?${query.toString()}`);
    },
  },
  {
    name: "hubspot_get_contact",
    description: "Get a contact by ID",
    action: "hubspot:get_contact",
    inputSchema: z.object({
      contactId: z.string(),
      properties: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = params.properties ? `?properties=${params.properties}` : "";
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/contacts/${params.contactId}${query}`);
    },
  },
  {
    name: "hubspot_create_contact",
    description: "Create a new contact in HubSpot",
    action: "hubspot:create_contact",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, "/crm/v3/objects/contacts", {
        method: "POST",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_update_contact",
    description: "Update a contact in HubSpot",
    action: "hubspot:update_contact",
    inputSchema: z.object({
      contactId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/contacts/${params.contactId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_search_contacts",
    description: "Search contacts in HubSpot",
    action: "hubspot:search_contacts",
    inputSchema: z.object({
      filterGroups: z.array(z.unknown()),
      sorts: z.array(z.unknown()).optional(),
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, "/crm/v3/objects/contacts/search", {
        method: "POST",
        body: JSON.stringify({ filterGroups: params.filterGroups, sorts: params.sorts, limit: params.limit }),
      });
    },
  },
  {
    name: "hubspot_list_deals",
    description: "List deals in HubSpot CRM",
    action: "hubspot:list_deals",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.properties) query.set("properties", params.properties as string);
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/deals?${query.toString()}`);
    },
  },
  {
    name: "hubspot_get_deal",
    description: "Get a deal by ID",
    action: "hubspot:get_deal",
    inputSchema: z.object({
      dealId: z.string(),
      properties: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = params.properties ? `?properties=${params.properties}` : "";
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/deals/${params.dealId}${query}`);
    },
  },
  {
    name: "hubspot_create_deal",
    description: "Create a new deal in HubSpot",
    action: "hubspot:create_deal",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, "/crm/v3/objects/deals", {
        method: "POST",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_update_deal",
    description: "Update a deal in HubSpot",
    action: "hubspot:update_deal",
    inputSchema: z.object({
      dealId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/deals/${params.dealId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_list_companies",
    description: "List companies in HubSpot CRM",
    action: "hubspot:list_companies",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      properties: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.properties) query.set("properties", params.properties as string);
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/companies?${query.toString()}`);
    },
  },
  {
    name: "hubspot_get_company",
    description: "Get a company by ID",
    action: "hubspot:get_company",
    inputSchema: z.object({
      companyId: z.string(),
      properties: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = params.properties ? `?properties=${params.properties}` : "";
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/companies/${params.companyId}${query}`);
    },
  },
  {
    name: "hubspot_create_company",
    description: "Create a new company in HubSpot",
    action: "hubspot:create_company",
    inputSchema: z.object({
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, "/crm/v3/objects/companies", {
        method: "POST",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_update_company",
    description: "Update a company in HubSpot",
    action: "hubspot:update_company",
    inputSchema: z.object({
      companyId: z.string(),
      properties: z.record(z.string(), z.string()),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, `/crm/v3/objects/companies/${params.companyId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties: params.properties }),
      });
    },
  },
  {
    name: "hubspot_search_companies",
    description: "Search companies in HubSpot",
    action: "hubspot:search_companies",
    inputSchema: z.object({
      filterGroups: z.array(z.unknown()),
      sorts: z.array(z.unknown()).optional(),
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return hubspotFetch(context.serviceConnectionId, "/crm/v3/objects/companies/search", {
        method: "POST",
        body: JSON.stringify({ filterGroups: params.filterGroups, sorts: params.sorts, limit: params.limit }),
      });
    },
  },
  // =====================
  // GitHub tools
  // =====================
  {
    name: "github_list_repos",
    description: "List repositories for the authenticated user",
    action: "github:list_repos",
    inputSchema: z.object({
      per_page: z.number().min(1).max(100).optional().default(30),
      sort: z.enum(["created", "updated", "pushed", "full_name"]).optional().default("updated"),
      type: z.enum(["all", "owner", "public", "private", "member"]).optional().default("all"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        per_page: String(params.per_page ?? 30),
        sort: (params.sort as string) || "updated",
        type: (params.type as string) || "all",
      });
      return githubFetch(context.serviceConnectionId, `/user/repos?${query.toString()}`);
    },
  },
  {
    name: "github_get_repo",
    description: "Get a repository by owner and name",
    action: "github:get_repo",
    inputSchema: z.object({ owner: z.string(), repo: z.string() }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}`);
    },
  },
  {
    name: "github_list_issues",
    description: "List issues for a repository",
    action: "github:list_issues",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("open"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        state: (params.state as string) || "open",
        per_page: String(params.per_page ?? 30),
      });
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/issues?${query.toString()}`);
    },
  },
  {
    name: "github_get_issue",
    description: "Get a specific issue",
    action: "github:get_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number(),
    }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/issues/${params.issue_number}`);
    },
  },
  {
    name: "github_create_issue",
    description: "Create a new issue",
    action: "github:create_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      labels: z.array(z.string()).optional(),
      assignees: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { owner, repo, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/issues`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_update_issue",
    description: "Update an existing issue",
    action: "github:update_issue",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      issue_number: z.number(),
      title: z.string().optional(),
      body: z.string().optional(),
      state: z.enum(["open", "closed"]).optional(),
      labels: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { owner, repo, issue_number, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/issues/${issue_number}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_list_pull_requests",
    description: "List pull requests for a repository",
    action: "github:list_pull_requests",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      state: z.enum(["open", "closed", "all"]).optional().default("open"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        state: (params.state as string) || "open",
        per_page: String(params.per_page ?? 30),
      });
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/pulls?${query.toString()}`);
    },
  },
  {
    name: "github_get_pull_request",
    description: "Get a specific pull request",
    action: "github:get_pull_request",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      pull_number: z.number(),
    }),
    handler: async (params, context) => {
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/pulls/${params.pull_number}`);
    },
  },
  {
    name: "github_create_pull_request",
    description: "Create a new pull request",
    action: "github:create_pull_request",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string().optional(),
      head: z.string().describe("Branch to merge from"),
      base: z.string().describe("Branch to merge into"),
    }),
    handler: async (params, context) => {
      const { owner, repo, ...body } = params;
      return githubFetch(context.serviceConnectionId, `/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "github_list_commits",
    description: "List commits for a repository",
    action: "github:list_commits",
    inputSchema: z.object({
      owner: z.string(),
      repo: z.string(),
      sha: z.string().optional().describe("Branch name or commit SHA"),
      per_page: z.number().min(1).max(100).optional().default(30),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ per_page: String(params.per_page ?? 30) });
      if (params.sha) query.set("sha", params.sha as string);
      return githubFetch(context.serviceConnectionId, `/repos/${params.owner}/${params.repo}/commits?${query.toString()}`);
    },
  },
  {
    name: "github_get_authenticated_user",
    description: "Get the authenticated GitHub user",
    action: "github:get_authenticated_user",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return githubFetch(context.serviceConnectionId, "/user");
    },
  },
  {
    name: "github_search_repos",
    description: "Search GitHub repositories",
    action: "github:search_repos",
    inputSchema: z.object({
      query: z.string(),
      per_page: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      const q = new URLSearchParams({ q: params.query as string, per_page: String(params.per_page ?? 10) });
      return githubFetch(context.serviceConnectionId, `/search/repositories?${q.toString()}`);
    },
  },
  {
    name: "github_search_issues",
    description: "Search GitHub issues and pull requests",
    action: "github:search_issues",
    inputSchema: z.object({
      query: z.string(),
      per_page: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      const q = new URLSearchParams({ q: params.query as string, per_page: String(params.per_page ?? 10) });
      return githubFetch(context.serviceConnectionId, `/search/issues?${q.toString()}`);
    },
  },
  // =====================
  // Jira tools
  // =====================
  {
    name: "jira_list_projects",
    description: "List all Jira projects",
    action: "jira:list_projects",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/project");
    },
  },
  {
    name: "jira_get_project",
    description: "Get a Jira project by key or ID",
    action: "jira:get_project",
    inputSchema: z.object({ projectIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/project/${params.projectIdOrKey}`);
    },
  },
  {
    name: "jira_search_issues",
    description: "Search Jira issues using JQL",
    action: "jira:search_issues",
    inputSchema: z.object({
      jql: z.string(),
      maxResults: z.number().min(1).max(100).optional().default(20),
      fields: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/search", {
        method: "POST",
        body: JSON.stringify({ jql: params.jql, maxResults: params.maxResults, fields: params.fields }),
      });
    },
  },
  {
    name: "jira_get_issue",
    description: "Get a Jira issue by key or ID",
    action: "jira:get_issue",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}`);
    },
  },
  {
    name: "jira_create_issue",
    description: "Create a new Jira issue",
    action: "jira:create_issue",
    inputSchema: z.object({
      projectKey: z.string(),
      summary: z.string(),
      issueType: z.string().default("Task"),
      description: z.unknown().optional(),
      assigneeId: z.string().optional(),
      priority: z.string().optional(),
    }),
    handler: async (params, context) => {
      const fields: Record<string, unknown> = {
        project: { key: params.projectKey },
        summary: params.summary,
        issuetype: { name: params.issueType },
      };
      if (params.description) fields.description = params.description;
      if (params.assigneeId) fields.assignee = { accountId: params.assigneeId };
      if (params.priority) fields.priority = { name: params.priority };
      return jiraFetch(context.serviceConnectionId, "/rest/api/3/issue", {
        method: "POST",
        body: JSON.stringify({ fields }),
      });
    },
  },
  {
    name: "jira_update_issue",
    description: "Update a Jira issue",
    action: "jira:update_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}`, {
        method: "PUT",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "jira_add_comment",
    description: "Add a comment to a Jira issue",
    action: "jira:add_comment",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      body: z.unknown().describe("Comment body in Atlassian Document Format or simple text"),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/comment`, {
        method: "POST",
        body: JSON.stringify({ body: params.body }),
      });
    },
  },
  {
    name: "jira_list_sprints",
    description: "List sprints for a Jira board",
    action: "jira:list_sprints",
    inputSchema: z.object({
      boardId: z.number(),
      state: z.string().optional().describe("active, closed, or future"),
    }),
    handler: async (params, context) => {
      const query = params.state ? `?state=${params.state}` : "";
      return jiraFetch(context.serviceConnectionId, `/rest/agile/1.0/board/${params.boardId}/sprint${query}`);
    },
  },
  {
    name: "jira_get_transitions",
    description: "Get available transitions for a Jira issue",
    action: "jira:get_transitions",
    inputSchema: z.object({ issueIdOrKey: z.string() }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/transitions`);
    },
  },
  {
    name: "jira_transition_issue",
    description: "Transition a Jira issue to a new status",
    action: "jira:transition_issue",
    inputSchema: z.object({
      issueIdOrKey: z.string(),
      transitionId: z.string(),
    }),
    handler: async (params, context) => {
      return jiraFetch(context.serviceConnectionId, `/rest/api/3/issue/${params.issueIdOrKey}/transitions`, {
        method: "POST",
        body: JSON.stringify({ transition: { id: params.transitionId } }),
      });
    },
  },
  // =====================
  // Salesforce tools
  // =====================
  {
    name: "salesforce_query",
    description: "Execute a SOQL query against Salesforce",
    action: "salesforce:query",
    inputSchema: z.object({ soql: z.string() }),
    handler: async (params, context) => {
      const q = encodeURIComponent(params.soql as string);
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/query?q=${q}`);
    },
  },
  {
    name: "salesforce_get_record",
    description: "Get a Salesforce record by type and ID",
    action: "salesforce:get_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`);
    },
  },
  {
    name: "salesforce_create_record",
    description: "Create a new Salesforce record",
    action: "salesforce:create_record",
    inputSchema: z.object({
      objectType: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}`, {
        method: "POST",
        body: JSON.stringify(params.fields),
      });
    },
  },
  {
    name: "salesforce_update_record",
    description: "Update a Salesforce record",
    action: "salesforce:update_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`, {
        method: "PATCH",
        body: JSON.stringify(params.fields),
      });
    },
  },
  {
    name: "salesforce_delete_record",
    description: "Delete a Salesforce record",
    action: "salesforce:delete_record",
    inputSchema: z.object({
      objectType: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/${params.recordId}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "salesforce_describe_object",
    description: "Describe a Salesforce object schema",
    action: "salesforce:describe_object",
    inputSchema: z.object({ objectType: z.string() }),
    handler: async (params, context) => {
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/sobjects/${params.objectType}/describe`);
    },
  },
  {
    name: "salesforce_list_objects",
    description: "List available Salesforce objects",
    action: "salesforce:list_objects",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return salesforceFetch(context.serviceConnectionId, "/services/data/v59.0/sobjects");
    },
  },
  {
    name: "salesforce_search",
    description: "Execute a SOSL search in Salesforce",
    action: "salesforce:search",
    inputSchema: z.object({ sosl: z.string() }),
    handler: async (params, context) => {
      const q = encodeURIComponent(params.sosl as string);
      return salesforceFetch(context.serviceConnectionId, `/services/data/v59.0/search?q=${q}`);
    },
  },
  // =====================
  // Meta Ads tools
  // =====================
  {
    name: "metaAds_list_ad_accounts",
    description: "List ad accounts for the authenticated user",
    action: "metaAds:list_ad_accounts",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return metaAdsFetch(context.serviceConnectionId, "/me/adaccounts?fields=name,account_id,account_status,currency,timezone_name");
    },
  },
  {
    name: "metaAds_get_ad_account",
    description: "Get details of an ad account",
    action: "metaAds:get_ad_account",
    inputSchema: z.object({ accountId: z.string().describe("Ad account ID (without act_ prefix)") }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/act_${params.accountId}?fields=name,account_id,account_status,currency,balance,amount_spent`);
    },
  },
  {
    name: "metaAds_list_campaigns",
    description: "List campaigns for an ad account",
    action: "metaAds:list_campaigns",
    inputSchema: z.object({
      accountId: z.string(),
      limit: z.number().min(1).max(100).optional().default(25),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/act_${params.accountId}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget,created_time&limit=${params.limit ?? 25}`);
    },
  },
  {
    name: "metaAds_get_campaign",
    description: "Get details of a campaign",
    action: "metaAds:get_campaign",
    inputSchema: z.object({ campaignId: z.string() }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.campaignId}?fields=name,status,objective,daily_budget,lifetime_budget`);
    },
  },
  {
    name: "metaAds_get_campaign_insights",
    description: "Get performance insights for a campaign",
    action: "metaAds:get_campaign_insights",
    inputSchema: z.object({
      campaignId: z.string(),
      date_preset: z.string().optional().default("last_30d"),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.campaignId}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr,reach,actions&date_preset=${params.date_preset ?? "last_30d"}`);
    },
  },
  {
    name: "metaAds_list_adsets",
    description: "List ad sets for an ad account",
    action: "metaAds:list_adsets",
    inputSchema: z.object({
      accountId: z.string(),
      limit: z.number().min(1).max(100).optional().default(25),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/act_${params.accountId}/adsets?fields=name,status,daily_budget,targeting,bid_amount&limit=${params.limit ?? 25}`);
    },
  },
  {
    name: "metaAds_get_adset",
    description: "Get details of an ad set",
    action: "metaAds:get_adset",
    inputSchema: z.object({ adsetId: z.string() }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.adsetId}?fields=name,status,daily_budget,targeting`);
    },
  },
  {
    name: "metaAds_get_adset_insights",
    description: "Get performance insights for an ad set",
    action: "metaAds:get_adset_insights",
    inputSchema: z.object({
      adsetId: z.string(),
      date_preset: z.string().optional().default("last_30d"),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.adsetId}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr,reach&date_preset=${params.date_preset ?? "last_30d"}`);
    },
  },
  {
    name: "metaAds_list_ads",
    description: "List ads for an ad account",
    action: "metaAds:list_ads",
    inputSchema: z.object({
      accountId: z.string(),
      limit: z.number().min(1).max(100).optional().default(25),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/act_${params.accountId}/ads?fields=name,status,creative,created_time&limit=${params.limit ?? 25}`);
    },
  },
  {
    name: "metaAds_get_ad",
    description: "Get details of an ad",
    action: "metaAds:get_ad",
    inputSchema: z.object({ adId: z.string() }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.adId}?fields=name,status,creative`);
    },
  },
  {
    name: "metaAds_get_ad_insights",
    description: "Get performance insights for an ad",
    action: "metaAds:get_ad_insights",
    inputSchema: z.object({
      adId: z.string(),
      date_preset: z.string().optional().default("last_30d"),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.adId}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr&date_preset=${params.date_preset ?? "last_30d"}`);
    },
  },
  {
    name: "metaAds_get_account_insights",
    description: "Get performance insights for an ad account",
    action: "metaAds:get_account_insights",
    inputSchema: z.object({
      accountId: z.string(),
      date_preset: z.string().optional().default("last_30d"),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/act_${params.accountId}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr,reach,actions&date_preset=${params.date_preset ?? "last_30d"}`);
    },
  },
  {
    name: "metaAds_update_campaign_status",
    description: "Update campaign status (ACTIVE or PAUSED)",
    action: "metaAds:update_campaign_status",
    inputSchema: z.object({
      campaignId: z.string(),
      status: z.enum(["ACTIVE", "PAUSED"]),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.campaignId}`, {
        method: "POST",
        body: JSON.stringify({ status: params.status }),
      });
    },
  },
  {
    name: "metaAds_update_adset_status",
    description: "Update ad set status (ACTIVE or PAUSED)",
    action: "metaAds:update_adset_status",
    inputSchema: z.object({
      adsetId: z.string(),
      status: z.enum(["ACTIVE", "PAUSED"]),
    }),
    handler: async (params, context) => {
      return metaAdsFetch(context.serviceConnectionId, `/${params.adsetId}`, {
        method: "POST",
        body: JSON.stringify({ status: params.status }),
      });
    },
  },
  // =====================
  // Twitter Ads tools
  // =====================
  {
    name: "twitterAds_list_accounts",
    description: "List Twitter Ads accounts",
    action: "twitterAds:list_accounts",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, "/accounts");
    },
  },
  {
    name: "twitterAds_get_account",
    description: "Get a Twitter Ads account",
    action: "twitterAds:get_account",
    inputSchema: z.object({ accountId: z.string() }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}`);
    },
  },
  {
    name: "twitterAds_list_campaigns",
    description: "List campaigns for a Twitter Ads account",
    action: "twitterAds:list_campaigns",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/campaigns?count=${params.count ?? 50}`);
    },
  },
  {
    name: "twitterAds_get_campaign",
    description: "Get a specific campaign",
    action: "twitterAds:get_campaign",
    inputSchema: z.object({
      accountId: z.string(),
      campaignId: z.string(),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/campaigns/${params.campaignId}`);
    },
  },
  {
    name: "twitterAds_list_line_items",
    description: "List line items (ad groups) for a Twitter Ads account",
    action: "twitterAds:list_line_items",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/line_items?count=${params.count ?? 50}`);
    },
  },
  {
    name: "twitterAds_get_line_item",
    description: "Get a specific line item",
    action: "twitterAds:get_line_item",
    inputSchema: z.object({
      accountId: z.string(),
      lineItemId: z.string(),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/line_items/${params.lineItemId}`);
    },
  },
  {
    name: "twitterAds_list_promoted_tweets",
    description: "List promoted tweets for a Twitter Ads account",
    action: "twitterAds:list_promoted_tweets",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/promoted_tweets?count=${params.count ?? 50}`);
    },
  },
  {
    name: "twitterAds_get_campaign_stats",
    description: "Get campaign performance statistics",
    action: "twitterAds:get_campaign_stats",
    inputSchema: z.object({
      accountId: z.string(),
      campaignIds: z.string().describe("Comma-separated campaign IDs"),
      start_time: z.string().describe("ISO 8601 date"),
      end_time: z.string().describe("ISO 8601 date"),
      granularity: z.enum(["HOUR", "DAY", "TOTAL"]).optional().default("DAY"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        entity: "CAMPAIGN",
        entity_ids: params.campaignIds as string,
        start_time: params.start_time as string,
        end_time: params.end_time as string,
        granularity: (params.granularity as string) || "DAY",
        metric_groups: "ENGAGEMENT",
      });
      return twitterAdsFetch(context.serviceConnectionId, `/stats/accounts/${params.accountId}?${query.toString()}`);
    },
  },
  {
    name: "twitterAds_update_campaign_status",
    description: "Update a campaign status",
    action: "twitterAds:update_campaign_status",
    inputSchema: z.object({
      accountId: z.string(),
      campaignId: z.string(),
      entity_status: z.enum(["ACTIVE", "PAUSED"]),
    }),
    handler: async (params, context) => {
      return twitterAdsFetch(context.serviceConnectionId, `/accounts/${params.accountId}/campaigns/${params.campaignId}`, {
        method: "PUT",
        body: JSON.stringify({ entity_status: params.entity_status }),
      });
    },
  },
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
  // =====================
  // SEMrush tools
  // =====================
  {
    name: "semrush_domain_overview",
    description: "Get domain overview metrics from SEMrush",
    action: "semrush:domain_overview",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_ranks",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        export_columns: "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
      });
    },
  },
  {
    name: "semrush_domain_organic",
    description: "Get organic search data for a domain",
    action: "semrush:domain_organic",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
      display_limit: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_organic",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        display_limit: String(params.display_limit ?? 10),
        export_columns: "Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr",
      });
    },
  },
  {
    name: "semrush_domain_organic_keywords",
    description: "Get organic keywords for a domain",
    action: "semrush:domain_organic_keywords",
    inputSchema: z.object({
      domain: z.string(),
      database: z.string().optional().default("us"),
      display_limit: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "domain_organic",
        domain: params.domain as string,
        database: (params.database as string) || "us",
        display_limit: String(params.display_limit ?? 10),
        export_columns: "Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr",
      });
    },
  },
  {
    name: "semrush_keyword_overview",
    description: "Get keyword overview data",
    action: "semrush:keyword_overview",
    inputSchema: z.object({
      phrase: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "phrase_all",
        phrase: params.phrase as string,
        database: (params.database as string) || "us",
        export_columns: "Ph,Nq,Cp,Co,Nr,Td",
      });
    },
  },
  {
    name: "semrush_keyword_difficulty",
    description: "Get keyword difficulty score",
    action: "semrush:keyword_difficulty",
    inputSchema: z.object({
      phrase: z.string(),
      database: z.string().optional().default("us"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "phrase_kdi",
        phrase: params.phrase as string,
        database: (params.database as string) || "us",
        export_columns: "Ph,Kd",
      });
    },
  },
  {
    name: "semrush_backlinks_overview",
    description: "Get backlinks overview for a domain",
    action: "semrush:backlinks_overview",
    inputSchema: z.object({
      target: z.string(),
      target_type: z.enum(["root_domain", "domain", "url"]).optional().default("root_domain"),
    }),
    handler: async (params, context) => {
      return semrushFetch(context.serviceConnectionId, {
        type: "backlinks_overview",
        target: params.target as string,
        target_type: (params.target_type as string) || "root_domain",
        export_columns: "total,domains_num,urls_num,ips_num,follows_num,nofollows_num",
      });
    },
  },
  // =====================
  // Ahrefs tools
  // =====================
  {
    name: "ahrefs_domain_rating",
    description: "Get domain rating from Ahrefs",
    action: "ahrefs:domain_rating",
    inputSchema: z.object({
      target: z.string(),
      date: z.string().optional(),
    }),
    handler: async (params, context) => {
      const p: Record<string, string> = { target: params.target as string };
      if (params.date) p.date = params.date as string;
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/domain-rating", p);
    },
  },
  {
    name: "ahrefs_backlinks",
    description: "Get backlinks from Ahrefs",
    action: "ahrefs:backlinks",
    inputSchema: z.object({
      target: z.string(),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/all-backlinks", {
        target: params.target as string,
        limit: String(params.limit ?? 50),
        select: "url_from,url_to,ahrefs_rank,domain_rating,anchor,first_seen,last_seen",
      });
    },
  },
  {
    name: "ahrefs_organic_keywords",
    description: "Get organic keywords from Ahrefs",
    action: "ahrefs:organic_keywords",
    inputSchema: z.object({
      target: z.string(),
      country: z.string().optional().default("us"),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/organic-keywords", {
        target: params.target as string,
        country: (params.country as string) || "us",
        limit: String(params.limit ?? 50),
        select: "keyword,volume,position,url,traffic,cpc",
      });
    },
  },
  {
    name: "ahrefs_referring_domains",
    description: "Get referring domains from Ahrefs",
    action: "ahrefs:referring_domains",
    inputSchema: z.object({
      target: z.string(),
      limit: z.number().min(1).max(1000).optional().default(50),
    }),
    handler: async (params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/site-explorer/refdomains", {
        target: params.target as string,
        limit: String(params.limit ?? 50),
        select: "domain,domain_rating,backlinks,first_seen,last_seen",
      });
    },
  },
  {
    name: "ahrefs_subscription_info",
    description: "Get Ahrefs subscription info",
    action: "ahrefs:subscription_info",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return ahrefsFetch(context.serviceConnectionId, "/subscription-info");
    },
  },
  // =====================
  // Stripe tools
  // =====================
  {
    name: "stripe_list_customers",
    description: "List Stripe customers",
    action: "stripe:list_customers",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/customers?limit=${params.limit ?? 10}`);
    },
  },
  {
    name: "stripe_get_customer",
    description: "Get a Stripe customer by ID",
    action: "stripe:get_customer",
    inputSchema: z.object({ customerId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/customers/${params.customerId}`);
    },
  },
  {
    name: "stripe_create_customer",
    description: "Create a new Stripe customer",
    action: "stripe:create_customer",
    inputSchema: z.object({
      email: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    handler: async (params, context) => {
      const formData: Record<string, string> = {};
      if (params.email) formData.email = params.email as string;
      if (params.name) formData.name = params.name as string;
      if (params.description) formData.description = params.description as string;
      return stripeFetch(context.serviceConnectionId, "/customers", { method: "POST", formData });
    },
  },
  {
    name: "stripe_list_subscriptions",
    description: "List Stripe subscriptions",
    action: "stripe:list_subscriptions",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.customer) query.set("customer", params.customer as string);
      return stripeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`);
    },
  },
  {
    name: "stripe_get_subscription",
    description: "Get a Stripe subscription by ID",
    action: "stripe:get_subscription",
    inputSchema: z.object({ subscriptionId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/subscriptions/${params.subscriptionId}`);
    },
  },
  {
    name: "stripe_list_invoices",
    description: "List Stripe invoices",
    action: "stripe:list_invoices",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
      customer: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ limit: String(params.limit ?? 10) });
      if (params.customer) query.set("customer", params.customer as string);
      return stripeFetch(context.serviceConnectionId, `/invoices?${query.toString()}`);
    },
  },
  {
    name: "stripe_get_invoice",
    description: "Get a Stripe invoice by ID",
    action: "stripe:get_invoice",
    inputSchema: z.object({ invoiceId: z.string() }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/invoices/${params.invoiceId}`);
    },
  },
  {
    name: "stripe_get_balance",
    description: "Get Stripe account balance",
    action: "stripe:get_balance",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return stripeFetch(context.serviceConnectionId, "/balance");
    },
  },
  {
    name: "stripe_list_charges",
    description: "List Stripe charges",
    action: "stripe:list_charges",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/charges?limit=${params.limit ?? 10}`);
    },
  },
  {
    name: "stripe_list_payment_intents",
    description: "List Stripe payment intents",
    action: "stripe:list_payment_intents",
    inputSchema: z.object({
      limit: z.number().min(1).max(100).optional().default(10),
    }),
    handler: async (params, context) => {
      return stripeFetch(context.serviceConnectionId, `/payment_intents?limit=${params.limit ?? 10}`);
    },
  },
  // =====================
  // Airtable tools
  // =====================
  {
    name: "airtable_list_bases",
    description: "List all Airtable bases",
    action: "airtable:list_bases",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return airtableFetch(context.serviceConnectionId, "/meta/bases");
    },
  },
  {
    name: "airtable_get_base_schema",
    description: "Get the schema of an Airtable base",
    action: "airtable:get_base_schema",
    inputSchema: z.object({ baseId: z.string() }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/meta/bases/${params.baseId}/tables`);
    },
  },
  {
    name: "airtable_list_records",
    description: "List records in an Airtable table",
    action: "airtable:list_records",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      maxRecords: z.number().min(1).max(100).optional().default(20),
      view: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ maxRecords: String(params.maxRecords ?? 20) });
      if (params.view) query.set("view", params.view as string);
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}?${query.toString()}`);
    },
  },
  {
    name: "airtable_get_record",
    description: "Get a specific Airtable record",
    action: "airtable:get_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`);
    },
  },
  {
    name: "airtable_create_record",
    description: "Create a new record in an Airtable table",
    action: "airtable:create_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}`, {
        method: "POST",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "airtable_update_record",
    description: "Update an Airtable record",
    action: "airtable:update_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
      fields: z.record(z.string(), z.unknown()),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: params.fields }),
      });
    },
  },
  {
    name: "airtable_delete_record",
    description: "Delete an Airtable record",
    action: "airtable:delete_record",
    inputSchema: z.object({
      baseId: z.string(),
      tableIdOrName: z.string(),
      recordId: z.string(),
    }),
    handler: async (params, context) => {
      return airtableFetch(context.serviceConnectionId, `/${params.baseId}/${params.tableIdOrName}/${params.recordId}`, {
        method: "DELETE",
      });
    },
  },
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
  // YouTube tools
  {
    name: "youtube_list_channels",
    description: "List YouTube channels for the authenticated user",
    action: "youtube:list_channels",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        mine: "true",
        maxResults: String(params.maxResults ?? 10),
      });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_channel",
    description: "Get details of a YouTube channel by ID",
    action: "youtube:get_channel",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails,brandingSettings",
        id: params.channelId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_videos",
    description: "List videos from a channel or the authenticated user's uploads",
    action: "youtube:list_videos",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
      order: z.enum(["date", "rating", "relevance", "title", "viewCount"]).optional().default("date"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "date",
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("forMine", "true");
      }
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      // search.list only supports snippet; fetch full details via videos.list
      const searchResult = await youtubeFetch(context.serviceConnectionId, `/search?${query.toString()}`) as { items?: Array<{ id?: { videoId?: string }; snippet?: unknown }>; [key: string]: unknown };
      const videoIds = (searchResult.items ?? [])
        .map((item) => item.id?.videoId)
        .filter(Boolean)
        .join(",");
      if (!videoIds) return searchResult;
      const detailQuery = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        id: videoIds,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos?${detailQuery.toString()}`);
    },
  },
  {
    name: "youtube_get_video",
    description: "Get details of a YouTube video by ID",
    action: "youtube:get_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails,status",
        id: params.videoId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`);
    },
  },
  {
    name: "youtube_upload_video",
    description: "Upload a video to YouTube from a URL. Downloads the video from the provided URL and uploads it via the YouTube resumable upload API. Returns the created video resource including video ID.",
    action: "youtube:upload_video",
    inputSchema: z.object({
      videoUrl: z.string().url("Must be a valid URL to the video file"),
      title: z.string().min(1).max(100),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).optional(),
      categoryId: z.string().optional().describe("YouTube video category ID (default: 22 - People & Blogs)"),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional().describe("Video privacy status (default: private)"),
    }),
    handler: async (params, context) => {
      return youtubeUploadVideo(context.serviceConnectionId, params.videoUrl as string, {
        title: params.title as string,
        description: params.description as string | undefined,
        tags: params.tags as string[] | undefined,
        categoryId: params.categoryId as string | undefined,
        privacyStatus: params.privacyStatus as "public" | "private" | "unlisted" | undefined,
      });
    },
  },
  {
    name: "youtube_update_video",
    description: "Update metadata for a YouTube video",
    action: "youtube:update_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
      categoryId: z.string().optional(),
    }),
    handler: async (params, context) => {
      const { videoId, ...fields } = params;
      const body: Record<string, unknown> = { id: videoId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.description) snippet.description = fields.description;
      if (fields.tags) snippet.tags = fields.tags;
      if (fields.categoryId) snippet.categoryId = fields.categoryId;
      if (Object.keys(snippet).length > 0) {
        // YouTube requires categoryId when updating snippet — fetch current value if not provided
        if (!snippet.categoryId) {
          const q = new URLSearchParams({ part: "snippet", id: String(videoId) });
          const current = await youtubeFetch(context.serviceConnectionId, `/videos?${q.toString()}`);
          const currentData = typeof current === "string" ? JSON.parse(current) : current;
          snippet.categoryId = currentData?.items?.[0]?.snippet?.categoryId ?? "22";
        }
        body.snippet = snippet;
      }
      if (fields.privacyStatus) body.status = { privacyStatus: fields.privacyStatus };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.status) parts.push("status");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_video",
    description: "Delete a YouTube video",
    action: "youtube:delete_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.videoId as string });
      return youtubeFetch(context.serviceConnectionId, `/videos?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_playlists",
    description: "List playlists for the authenticated user or a channel",
    action: "youtube:list_playlists",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_playlist",
    description: "Get details of a YouTube playlist by ID",
    action: "youtube:get_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        id: params.playlistId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`);
    },
  },
  {
    name: "youtube_create_playlist",
    description: "Create a new YouTube playlist",
    action: "youtube:create_playlist",
    inputSchema: z.object({
      title: z.string(),
      description: z.string().optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional().default("private"),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          title: params.title,
          description: params.description || "",
        },
        status: {
          privacyStatus: params.privacyStatus || "private",
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/playlists?part=snippet,status", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_playlist",
    description: "Update a YouTube playlist",
    action: "youtube:update_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      privacyStatus: z.enum(["public", "private", "unlisted"]).optional(),
    }),
    handler: async (params, context) => {
      const { playlistId, ...fields } = params;
      const body: Record<string, unknown> = { id: playlistId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.description) snippet.description = fields.description;
      if (Object.keys(snippet).length > 0) body.snippet = snippet;
      if (fields.privacyStatus) body.status = { privacyStatus: fields.privacyStatus };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.status) parts.push("status");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_playlist",
    description: "Delete a YouTube playlist",
    action: "youtube:delete_playlist",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.playlistId as string });
      return youtubeFetch(context.serviceConnectionId, `/playlists?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_playlist_items",
    description: "List videos in a YouTube playlist",
    action: "youtube:list_playlist_items",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails,status",
        playlistId: params.playlistId as string,
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?${query.toString()}`);
    },
  },
  {
    name: "youtube_add_playlist_item",
    description: "Add a video to a YouTube playlist",
    action: "youtube:add_playlist_item",
    inputSchema: z.object({
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      position: z.number().optional(),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        snippet: {
          playlistId: params.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: params.videoId,
          },
        },
      };
      if (params.position !== undefined) {
        (body.snippet as Record<string, unknown>).position = params.position;
      }
      return youtubeFetch(context.serviceConnectionId, "/playlistItems?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_remove_playlist_item",
    description: "Remove a video from a YouTube playlist",
    action: "youtube:remove_playlist_item",
    inputSchema: z.object({
      playlistItemId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist item ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.playlistItemId as string });
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_search",
    description: "Search YouTube for videos, channels, or playlists",
    action: "youtube:search",
    inputSchema: z.object({
      query: z.string(),
      type: z.enum(["video", "channel", "playlist"]).optional().default("video"),
      maxResults: z.number().optional().default(10),
      order: z.enum(["date", "rating", "relevance", "title", "viewCount"]).optional().default("relevance"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        q: params.query as string,
        type: (params.type as string) || "video",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "relevance",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/search?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_comments",
    description: "List comments on a YouTube video",
    action: "youtube:list_comments",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      maxResults: z.number().optional().default(20),
      order: z.enum(["time", "relevance"]).optional().default("time"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,replies",
        videoId: params.videoId as string,
        maxResults: String(params.maxResults ?? 20),
        order: (params.order as string) || "time",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/commentThreads?${query.toString()}`);
    },
  },
  {
    name: "youtube_add_comment",
    description: "Add a comment to a YouTube video",
    action: "youtube:add_comment",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          videoId: params.videoId,
          topLevelComment: {
            snippet: {
              textOriginal: params.text,
            },
          },
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/commentThreads?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_comment",
    description: "Delete a YouTube comment",
    action: "youtube:delete_comment",
    inputSchema: z.object({
      commentId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.commentId as string });
      return youtubeFetch(context.serviceConnectionId, `/comments?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_subscriptions",
    description: "List subscriptions for the authenticated user",
    action: "youtube:list_subscriptions",
    inputSchema: z.object({
      maxResults: z.number().optional().default(10),
      order: z.enum(["alphabetical", "relevance", "unread"]).optional().default("relevance"),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails",
        mine: "true",
        maxResults: String(params.maxResults ?? 10),
        order: (params.order as string) || "relevance",
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`);
    },
  },
  {
    name: "youtube_get_analytics",
    description: "Get analytics for the authenticated user's YouTube channel (views, watch time, subscribers)",
    action: "youtube:get_analytics",
    inputSchema: z.object({
      channelId: z.string().optional(),
      maxResults: z.number().optional().default(10),
    }),
    handler: async (params, context) => {
      // Use the YouTube Data API to get channel statistics (basic analytics)
      const query = new URLSearchParams({
        part: "snippet,statistics,contentDetails",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.channelId) {
        query.set("id", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`);
    },
  },

  // ─── YouTube additional tools ──────────────────────────────────────────
  {
    name: "youtube_update_channel",
    description: "Update YouTube channel branding settings (title, description, keywords, country)",
    action: "youtube:update_channel",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional().describe("Space-separated keywords"),
      country: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
      defaultLanguage: z.string().optional().describe("BCP-47 language code"),
      madeForKids: z.boolean().optional(),
    }),
    handler: async (params, context) => {
      const { channelId, madeForKids, ...fields } = params;
      const body: Record<string, unknown> = { id: channelId };
      const channel: Record<string, unknown> = {};
      if (fields.title) channel.title = fields.title;
      if (fields.description) channel.description = fields.description;
      if (fields.keywords) channel.keywords = fields.keywords;
      if (fields.country) channel.country = fields.country;
      if (fields.defaultLanguage) channel.defaultLanguage = fields.defaultLanguage;

      const parts: string[] = [];
      if (Object.keys(channel).length > 0) {
        body.brandingSettings = { channel };
        parts.push("brandingSettings");
      }
      if (madeForKids !== undefined) {
        body.status = { selfDeclaredMadeForKids: madeForKids };
        parts.push("status");
      }
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/channels?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_list_captions",
    description: "List caption tracks for a YouTube video",
    action: "youtube:list_captions",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        videoId: params.videoId as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/captions?${query.toString()}`);
    },
  },
  {
    name: "youtube_download_caption",
    description: "Download caption track content for a YouTube video",
    action: "youtube:download_caption",
    inputSchema: z.object({
      captionId: z.string(),
      tfmt: z.enum(["sbv", "scc", "srt", "ttml", "vtt"]).optional().default("srt").describe("Caption format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.tfmt) query.set("tfmt", params.tfmt as string);
      const qs = query.toString();
      return youtubeFetch(
        context.serviceConnectionId,
        `/captions/${params.captionId}${qs ? `?${qs}` : ""}`,
        undefined,
        { responseType: "text" },
      );
    },
  },
  {
    name: "youtube_delete_caption",
    description: "Delete a caption track from a YouTube video",
    action: "youtube:delete_caption",
    inputSchema: z.object({
      captionId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.captionId as string });
      return youtubeFetch(context.serviceConnectionId, `/captions?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_channel_sections",
    description: "List sections of a YouTube channel",
    action: "youtube:list_channel_sections",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format").optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet,contentDetails",
      });
      if (params.channelId) {
        query.set("channelId", params.channelId as string);
      } else {
        query.set("mine", "true");
      }
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`);
    },
  },
  {
    name: "youtube_create_channel_section",
    description: "Create a section on a YouTube channel",
    action: "youtube:create_channel_section",
    inputSchema: z.object({
      type: z.enum(["singlePlaylist", "multiplePlaylists", "popularUploads", "recentUploads", "likes", "allPlaylists", "recentActivity", "recentPosts"]),
      title: z.string().optional(),
      position: z.number().optional(),
      playlistIds: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const snippet: Record<string, unknown> = { type: params.type };
      if (params.title) snippet.title = params.title;
      if (params.position !== undefined) snippet.position = params.position;

      const body: Record<string, unknown> = { snippet };
      const parts = ["snippet"];
      if ((params.playlistIds as string[] | undefined)?.length) {
        body.contentDetails = { playlists: params.playlistIds };
        parts.push("contentDetails");
      }
      return youtubeFetch(context.serviceConnectionId, `/channelSections?part=${parts.join(",")}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_channel_section",
    description: "Update a section on a YouTube channel",
    action: "youtube:update_channel_section",
    inputSchema: z.object({
      sectionId: z.string(),
      title: z.string().optional(),
      position: z.number().optional(),
      playlistIds: z.array(z.string()).optional(),
    }),
    handler: async (params, context) => {
      const { sectionId, ...fields } = params;
      const body: Record<string, unknown> = { id: sectionId };
      const snippet: Record<string, unknown> = {};
      if (fields.title) snippet.title = fields.title;
      if (fields.position !== undefined) snippet.position = fields.position;
      if (Object.keys(snippet).length > 0) body.snippet = snippet;
      if ((fields.playlistIds as string[] | undefined)?.length) body.contentDetails = { playlists: fields.playlistIds };

      const parts: string[] = [];
      if (body.snippet) parts.push("snippet");
      if (body.contentDetails) parts.push("contentDetails");
      if (parts.length === 0) throw new Error("At least one field to update is required");

      const query = new URLSearchParams({ part: parts.join(",") });
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_delete_channel_section",
    description: "Delete a section from a YouTube channel",
    action: "youtube:delete_channel_section",
    inputSchema: z.object({
      sectionId: z.string(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.sectionId as string });
      return youtubeFetch(context.serviceConnectionId, `/channelSections?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_comment_replies",
    description: "List replies to a YouTube comment",
    action: "youtube:list_comment_replies",
    inputSchema: z.object({
      parentId: z.string().describe("The comment ID to get replies for"),
      maxResults: z.number().optional().default(20),
      pageToken: z.string().optional(),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        parentId: params.parentId as string,
        maxResults: String(params.maxResults ?? 20),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      return youtubeFetch(context.serviceConnectionId, `/comments?${query.toString()}`);
    },
  },
  {
    name: "youtube_reply_to_comment",
    description: "Reply to an existing YouTube comment",
    action: "youtube:reply_to_comment",
    inputSchema: z.object({
      parentId: z.string().describe("The comment ID to reply to"),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          parentId: params.parentId,
          textOriginal: params.text,
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/comments?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_update_comment",
    description: "Edit a YouTube comment",
    action: "youtube:update_comment",
    inputSchema: z.object({
      commentId: z.string(),
      text: z.string(),
    }),
    handler: async (params, context) => {
      const body = {
        id: params.commentId,
        snippet: {
          textOriginal: params.text,
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/comments?part=snippet", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_set_comment_moderation",
    description: "Set moderation status for YouTube comments (held for review, published, or rejected)",
    action: "youtube:set_comment_moderation",
    inputSchema: z.object({
      commentId: z.string(),
      moderationStatus: z.enum(["heldForReview", "published", "rejected"]),
      banAuthor: z.boolean().optional().default(false),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: params.commentId as string,
        moderationStatus: params.moderationStatus as string,
        banAuthor: String(params.banAuthor ?? false),
      });
      return youtubeFetch(context.serviceConnectionId, `/comments/setModerationStatus?${query.toString()}`, {
        method: "POST",
      });
    },
  },
  {
    name: "youtube_list_languages",
    description: "List content languages supported by YouTube",
    action: "youtube:list_languages",
    inputSchema: z.object({
      hl: z.string().optional().describe("Host language for response localization (BCP-47 code)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ part: "snippet" });
      if (params.hl) query.set("hl", params.hl as string);
      return youtubeFetch(context.serviceConnectionId, `/i18nLanguages?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_regions",
    description: "List content regions supported by YouTube",
    action: "youtube:list_regions",
    inputSchema: z.object({
      hl: z.string().optional().describe("Host language for response localization (BCP-47 code)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ part: "snippet" });
      if (params.hl) query.set("hl", params.hl as string);
      return youtubeFetch(context.serviceConnectionId, `/i18nRegions?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_members",
    description: "List members of the authenticated user's YouTube channel (requires channel memberships)",
    action: "youtube:list_members",
    inputSchema: z.object({
      mode: z.enum(["list_members", "updates"]).optional().default("list_members"),
      maxResults: z.number().optional().default(10),
      pageToken: z.string().optional(),
      filterByMemberChannelId: z.string().optional().describe("Filter by specific member channel ID"),
      hasAccessToLevel: z.string().optional().describe("Filter by membership level ID"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        mode: (params.mode as string) || "list_members",
        maxResults: String(params.maxResults ?? 10),
      });
      if (params.pageToken) query.set("pageToken", params.pageToken as string);
      if (params.filterByMemberChannelId) query.set("filterByMemberChannelId", params.filterByMemberChannelId as string);
      if (params.hasAccessToLevel) query.set("hasAccessToLevel", params.hasAccessToLevel as string);
      return youtubeFetch(context.serviceConnectionId, `/members?${query.toString()}`);
    },
  },
  {
    name: "youtube_list_membership_levels",
    description: "List membership levels for the authenticated user's YouTube channel",
    action: "youtube:list_membership_levels",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return youtubeFetch(context.serviceConnectionId, "/membershipsLevels?part=snippet");
    },
  },
  {
    name: "youtube_update_playlist_item",
    description: "Update position or video note for a playlist item",
    action: "youtube:update_playlist_item",
    inputSchema: z.object({
      playlistItemId: z.string(),
      playlistId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid playlist ID format"),
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      position: z.number().optional(),
      note: z.string().optional(),
    }),
    handler: async (params, context) => {
      const body: Record<string, unknown> = {
        id: params.playlistItemId,
        snippet: {
          playlistId: params.playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: params.videoId,
          },
        },
      };
      if (params.position !== undefined) {
        (body.snippet as Record<string, unknown>).position = params.position;
      }
      if (params.note) {
        body.contentDetails = { note: params.note };
      }
      const parts = ["snippet"];
      if (body.contentDetails) parts.push("contentDetails");
      return youtubeFetch(context.serviceConnectionId, `/playlistItems?part=${parts.join(",")}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_subscribe",
    description: "Subscribe to a YouTube channel",
    action: "youtube:subscribe",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const body = {
        snippet: {
          resourceId: {
            kind: "youtube#channel",
            channelId: params.channelId,
          },
        },
      };
      return youtubeFetch(context.serviceConnectionId, "/subscriptions?part=snippet", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
  {
    name: "youtube_unsubscribe",
    description: "Unsubscribe from a YouTube channel",
    action: "youtube:unsubscribe",
    inputSchema: z.object({
      subscriptionId: z.string().describe("The subscription ID (not the channel ID)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ id: params.subscriptionId as string });
      return youtubeFetch(context.serviceConnectionId, `/subscriptions?${query.toString()}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "youtube_list_categories",
    description: "List YouTube video categories for a region",
    action: "youtube:list_categories",
    inputSchema: z.object({
      regionCode: z.string().optional().default("US").describe("ISO 3166-1 alpha-2 country code"),
      hl: z.string().optional().default("en").describe("Language for category titles"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        part: "snippet",
        regionCode: (params.regionCode as string) || "US",
        hl: (params.hl as string) || "en",
      });
      return youtubeFetch(context.serviceConnectionId, `/videoCategories?${query.toString()}`);
    },
  },
  {
    name: "youtube_rate_video",
    description: "Rate a YouTube video (like, dislike, or remove rating)",
    action: "youtube:rate_video",
    inputSchema: z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid video ID format"),
      rating: z.enum(["like", "dislike", "none"]),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: params.videoId as string,
        rating: params.rating as string,
      });
      return youtubeFetch(context.serviceConnectionId, `/videos/rate?${query.toString()}`, {
        method: "POST",
      });
    },
  },
  {
    name: "youtube_get_rating",
    description: "Get the authenticated user's rating for YouTube videos",
    action: "youtube:get_rating",
    inputSchema: z.object({
      videoIds: z.array(z.string()).describe("Video IDs to check ratings for (max 50)"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({
        id: (params.videoIds as string[]).join(","),
      });
      return youtubeFetch(context.serviceConnectionId, `/videos/getRating?${query.toString()}`);
    },
  },
  {
    name: "youtube_unset_watermark",
    description: "Remove the watermark image from a YouTube channel",
    action: "youtube:unset_watermark",
    inputSchema: z.object({
      channelId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid channel ID format"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams({ channelId: params.channelId as string });
      return youtubeFetch(context.serviceConnectionId, `/watermarks/unset?${query.toString()}`, {
        method: "POST",
      });
    },
  },

  // ─── Threads tools ────────────────────────────────────────────────────
  {
    name: "threads_get_profile",
    description: "Get the authenticated Threads user's profile",
    action: "threads:get_profile",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        "/me?fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified"
      );
    },
  },
  {
    name: "threads_get_threads",
    description: "Get the authenticated user's threads",
    action: "threads:get_threads",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of threads to return (default 25)"),
      after: z.string().optional().describe("Pagination cursor"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,media_url,shortcode,has_replies,is_reply,reply_audience,topic_tag";
      let path = `/me/threads?fields=${fields}&limit=${params.limit ?? 25}`;
      if (params.after) path += `&after=${params.after}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_thread",
    description: "Get a specific thread by ID",
    action: "threads:get_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,media_url,shortcode,has_replies,is_reply,root_post,replied_to,reply_audience,topic_tag,link_attachment_url";
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}?fields=${fields}`);
    },
  },
  {
    name: "threads_publish_thread",
    description: "Create and publish a thread. For text posts, set media_type to TEXT. For images, set to IMAGE with image_url. For videos, set to VIDEO with video_url.",
    action: "threads:publish_thread",
    inputSchema: z.object({
      text: z.string().optional().describe("Post text (max 500 characters)"),
      media_type: z.enum(["TEXT", "IMAGE", "VIDEO"]).describe("Type of media"),
      image_url: z.string().optional().describe("Public URL of the image (for IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (for VIDEO type)"),
      reply_control: z.enum(["everyone", "accounts_you_follow", "mentioned_only"]).optional().describe("Who can reply"),
      link_attachment: z.string().optional().describe("URL to attach (TEXT posts only)"),
      quote_post_id: z.string().optional().describe("ID of post to quote"),
    }),
    handler: async (params, context) => {
      // Step 1: Create media container
      const body: Record<string, string> = {
        media_type: params.media_type as string,
      };
      if (params.text) body.text = params.text as string;
      if (params.image_url) body.image_url = params.image_url as string;
      if (params.video_url) body.video_url = params.video_url as string;
      if (params.reply_control) body.reply_control = params.reply_control as string;
      if (params.link_attachment) body.link_attachment = params.link_attachment as string;
      if (params.quote_post_id) body.quote_post_id = params.quote_post_id as string;

      const containerResult = (await threadsFetch(
        context.serviceConnectionId,
        "/me/threads",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      )) as { id: string };

      // Step 2: Publish
      const publishResult = await threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publish",
        {
          method: "POST",
          body: JSON.stringify({ creation_id: containerResult.id }),
        }
      );

      return publishResult;
    },
  },
  {
    name: "threads_delete_thread",
    description: "Delete a thread by ID",
    action: "threads:delete_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID to delete"),
    }),
    handler: async (params, context) => {
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}`, {
        method: "DELETE",
      });
    },
  },
  {
    name: "threads_get_replies",
    description: "Get top-level replies to a thread",
    action: "threads:get_replies",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
      reverse: z.boolean().optional().describe("Reverse chronological order (default true)"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,has_replies";
      let path = `/${params.threadId}/replies?fields=${fields}`;
      if (params.reverse !== undefined) path += `&reverse=${params.reverse}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_conversation",
    description: "Get all replies at any depth for a thread (flattened)",
    action: "threads:get_conversation",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
      reverse: z.boolean().optional().describe("Reverse chronological order (default true)"),
    }),
    handler: async (params, context) => {
      const fields = "id,text,username,permalink,timestamp,media_type,has_replies";
      let path = `/${params.threadId}/conversation?fields=${fields}`;
      if (params.reverse !== undefined) path += `&reverse=${params.reverse}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_reply_to_thread",
    description: "Reply to a specific thread",
    action: "threads:reply_to_thread",
    inputSchema: z.object({
      reply_to_id: z.string().describe("The thread media ID to reply to"),
      text: z.string().optional().describe("Reply text (max 500 characters)"),
      media_type: z.enum(["TEXT", "IMAGE", "VIDEO"]).describe("Type of media"),
      image_url: z.string().optional().describe("Public URL of the image (for IMAGE type)"),
      video_url: z.string().optional().describe("Public URL of the video (for VIDEO type)"),
    }),
    handler: async (params, context) => {
      // Step 1: Create reply container
      const body: Record<string, string> = {
        media_type: params.media_type as string,
        reply_to_id: params.reply_to_id as string,
      };
      if (params.text) body.text = params.text as string;
      if (params.image_url) body.image_url = params.image_url as string;
      if (params.video_url) body.video_url = params.video_url as string;

      const containerResult = (await threadsFetch(
        context.serviceConnectionId,
        "/me/threads",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      )) as { id: string };

      // Step 2: Publish reply
      return threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publish",
        {
          method: "POST",
          body: JSON.stringify({ creation_id: containerResult.id }),
        }
      );
    },
  },
  {
    name: "threads_repost_thread",
    description: "Repost a thread",
    action: "threads:repost_thread",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID to repost"),
    }),
    handler: async (params, context) => {
      return threadsFetch(context.serviceConnectionId, `/${params.threadId}/repost`, {
        method: "POST",
      });
    },
  },
  {
    name: "threads_get_thread_insights",
    description: "Get insights (views, likes, replies, reposts, quotes, shares) for a specific thread",
    action: "threads:get_thread_insights",
    inputSchema: z.object({
      threadId: z.string().describe("The thread media ID"),
    }),
    handler: async (params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        `/${params.threadId}/insights?metric=views,likes,replies,reposts,quotes,shares`
      );
    },
  },
  {
    name: "threads_get_user_insights",
    description: "Get user-level insights (views, likes, replies, reposts, quotes, followers_count)",
    action: "threads:get_user_insights",
    inputSchema: z.object({
      metric: z.enum(["views", "likes", "replies", "reposts", "quotes", "followers_count"]).describe("Metric to retrieve"),
      since: z.number().optional().describe("Start timestamp (Unix seconds)"),
      until: z.number().optional().describe("End timestamp (Unix seconds)"),
    }),
    handler: async (params, context) => {
      let path = `/me/threads_insights?metric=${params.metric}`;
      if (params.since) path += `&since=${params.since}`;
      if (params.until) path += `&until=${params.until}`;
      return threadsFetch(context.serviceConnectionId, path);
    },
  },
  {
    name: "threads_get_publishing_limit",
    description: "Check the current publishing quota usage",
    action: "threads:get_publishing_limit",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        "/me/threads_publishing_limit?fields=quota_usage,config"
      );
    },
  },
  {
    name: "threads_lookup_profile",
    description: "Look up a public Threads profile by username",
    action: "threads:lookup_profile",
    inputSchema: z.object({
      username: z.string().describe("The Threads username to look up"),
    }),
    handler: async (params, context) => {
      return threadsFetch(
        context.serviceConnectionId,
        `/profile_lookup?username=${encodeURIComponent(params.username as string)}&fields=id,username,name,threads_profile_picture_url,threads_biography,is_verified,follower_count`
      );
    },
  },

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
      to: z.string().describe("Recipient email address(es), comma-separated for multiple"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      cc: z.string().optional().describe("CC recipients, comma-separated"),
      bcc: z.string().optional().describe("BCC recipients, comma-separated"),
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
  // Google Tag Manager tools
  // Accounts
  {
    name: "googleTagManager_list_accounts",
    description: "List all Google Tag Manager accounts the user has access to",
    action: "googleTagManager:list_accounts",
    inputSchema: z.object({}),
    handler: async (_params, context) => {
      return googleTagManagerFetch(context.serviceConnectionId, "/accounts");
    },
  },
  {
    name: "googleTagManager_get_account",
    description: "Get details of a specific GTM account",
    action: "googleTagManager:get_account",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}`
      );
    },
  },
  {
    name: "googleTagManager_update_account",
    description: "Update a GTM account's settings",
    action: "googleTagManager:update_account",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      name: z.string().describe("New account name"),
      shareData: z.boolean().optional().describe("Whether to share data with Google anonymously"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, shareData: params.shareData }),
        }
      );
    },
  },
  // Containers
  {
    name: "googleTagManager_list_containers",
    description: "List all containers in a GTM account",
    action: "googleTagManager:list_containers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers`
      );
    },
  },
  {
    name: "googleTagManager_get_container",
    description: "Get details of a specific GTM container",
    action: "googleTagManager:get_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`
      );
    },
  },
  {
    name: "googleTagManager_create_container",
    description: "Create a new GTM container in an account",
    action: "googleTagManager:create_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      name: z.string().describe("Container name"),
      usageContext: z.array(z.enum(["web", "androidSdk5", "iosSdk5", "amp", "server"])).describe("Usage contexts for the container"),
      domainName: z.array(z.string()).optional().describe("List of domain names associated with the container"),
      notes: z.string().optional().describe("Optional notes about the container"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            usageContext: params.usageContext,
            domainName: params.domainName,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_container",
    description: "Update a GTM container's settings",
    action: "googleTagManager:update_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Container name"),
      usageContext: z.array(z.enum(["web", "androidSdk5", "iosSdk5", "amp", "server"])).describe("Usage contexts for the container"),
      domainName: z.array(z.string()).optional().describe("List of domain names"),
      notes: z.string().optional().describe("Optional notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            usageContext: params.usageContext,
            domainName: params.domainName,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_container",
    description: "Delete a GTM container",
    action: "googleTagManager:delete_container",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_container_snippet",
    description: "Get the GTM JavaScript snippet code for a container",
    action: "googleTagManager:get_container_snippet",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}:snippet`
      );
    },
  },
  // Workspaces
  {
    name: "googleTagManager_list_workspaces",
    description: "List all workspaces in a GTM container",
    action: "googleTagManager:list_workspaces",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces`
      );
    },
  },
  {
    name: "googleTagManager_get_workspace",
    description: "Get details of a specific GTM workspace",
    action: "googleTagManager:get_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`
      );
    },
  },
  {
    name: "googleTagManager_create_workspace",
    description: "Create a new workspace in a GTM container",
    action: "googleTagManager:create_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Workspace name"),
      description: z.string().optional().describe("Workspace description"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, description: params.description }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_workspace",
    description: "Update a GTM workspace's name or description",
    action: "googleTagManager:update_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Workspace name"),
      description: z.string().optional().describe("Workspace description"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, description: params.description }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_workspace",
    description: "Delete a GTM workspace",
    action: "googleTagManager:delete_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_workspace_status",
    description: "Get the current status of a GTM workspace — lists modified entities and merge conflicts",
    action: "googleTagManager:get_workspace_status",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:getStatus`
      );
    },
  },
  {
    name: "googleTagManager_quick_preview_workspace",
    description: "Create a quick preview of a GTM workspace for debugging and testing",
    action: "googleTagManager:quick_preview_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:quick_preview`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_sync_workspace",
    description: "Sync a GTM workspace to the latest container version",
    action: "googleTagManager:sync_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:sync`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_resolve_workspace_conflict",
    description: "Resolve a merge conflict in a GTM workspace by accepting the workspace or container version entity",
    action: "googleTagManager:resolve_workspace_conflict",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      entity: z.record(z.string(), z.unknown()).describe("The entity to resolve the conflict with (workspace or container version entity)"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:resolve_conflict`,
        {
          method: "POST",
          body: JSON.stringify({ entity: params.entity }),
        }
      );
    },
  },
  {
    name: "googleTagManager_create_version_from_workspace",
    description: "Create a new container version from a GTM workspace",
    action: "googleTagManager:create_version_from_workspace",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().optional().describe("Version name"),
      notes: z.string().optional().describe("Version notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}:create_version`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  // Tags
  {
    name: "googleTagManager_list_tags",
    description: "List all tags in a GTM workspace",
    action: "googleTagManager:list_tags",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags`
      );
    },
  },
  {
    name: "googleTagManager_get_tag",
    description: "Get details of a specific tag in a GTM workspace",
    action: "googleTagManager:get_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`
      );
    },
  },
  {
    name: "googleTagManager_create_tag",
    description: "Create a new tag in a GTM workspace",
    action: "googleTagManager:create_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Tag name"),
      type: z.string().describe("Tag type (e.g. 'ua', 'ga4', 'html', 'img')"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Tag parameters as GTM Parameter objects"),
      firingTriggerId: z.array(z.string()).optional().describe("Firing trigger IDs"),
      blockingTriggerId: z.array(z.string()).optional().describe("Blocking trigger IDs"),
      notes: z.string().optional().describe("Notes about the tag"),
      tagFiringOption: z.enum(["oncePerEvent", "oncePerLoad", "unlimited"]).optional().describe("Tag firing option"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            firingTriggerId: params.firingTriggerId,
            blockingTriggerId: params.blockingTriggerId,
            notes: params.notes,
            tagFiringOption: params.tagFiringOption,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_tag",
    description: "Update an existing tag in a GTM workspace",
    action: "googleTagManager:update_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
      name: z.string().describe("Tag name"),
      type: z.string().describe("Tag type"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Tag parameters as GTM Parameter objects"),
      firingTriggerId: z.array(z.string()).optional().describe("Firing trigger IDs"),
      blockingTriggerId: z.array(z.string()).optional().describe("Blocking trigger IDs"),
      notes: z.string().optional().describe("Notes about the tag"),
      tagFiringOption: z.enum(["oncePerEvent", "oncePerLoad", "unlimited"]).optional().describe("Tag firing option"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            firingTriggerId: params.firingTriggerId,
            blockingTriggerId: params.blockingTriggerId,
            notes: params.notes,
            tagFiringOption: params.tagFiringOption,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_tag",
    description: "Delete a tag from a GTM workspace",
    action: "googleTagManager:delete_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_tag",
    description: "Revert changes to a tag in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_tag",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      tagId: z.string().describe("The GTM tag ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/tags/${params.tagId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Triggers
  {
    name: "googleTagManager_list_triggers",
    description: "List all triggers in a GTM workspace",
    action: "googleTagManager:list_triggers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers`
      );
    },
  },
  {
    name: "googleTagManager_get_trigger",
    description: "Get details of a specific trigger in a GTM workspace",
    action: "googleTagManager:get_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`
      );
    },
  },
  {
    name: "googleTagManager_create_trigger",
    description: "Create a new trigger in a GTM workspace",
    action: "googleTagManager:create_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Trigger name"),
      type: z.string().describe("Trigger type (e.g. 'pageview', 'click', 'customEvent', 'domReady', 'windowLoaded')"),
      filter: z.array(z.record(z.string(), z.unknown())).optional().describe("Trigger filters as GTM Condition objects"),
      autoEventFilter: z.array(z.record(z.string(), z.unknown())).optional().describe("Auto event filters"),
      customEventFilter: z.array(z.record(z.string(), z.unknown())).optional().describe("Custom event filters (for customEvent type)"),
      notes: z.string().optional().describe("Notes about the trigger"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            filter: params.filter,
            autoEventFilter: params.autoEventFilter,
            customEventFilter: params.customEventFilter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_trigger",
    description: "Update an existing trigger in a GTM workspace",
    action: "googleTagManager:update_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
      name: z.string().describe("Trigger name"),
      type: z.string().describe("Trigger type"),
      filter: z.array(z.record(z.string(), z.unknown())).optional().describe("Trigger filters as GTM Condition objects"),
      notes: z.string().optional().describe("Notes about the trigger"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            filter: params.filter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_trigger",
    description: "Delete a trigger from a GTM workspace",
    action: "googleTagManager:delete_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_trigger",
    description: "Revert changes to a trigger in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_trigger",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      triggerId: z.string().describe("The GTM trigger ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/triggers/${params.triggerId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Variables
  {
    name: "googleTagManager_list_variables",
    description: "List all variables in a GTM workspace",
    action: "googleTagManager:list_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables`
      );
    },
  },
  {
    name: "googleTagManager_get_variable",
    description: "Get details of a specific variable in a GTM workspace",
    action: "googleTagManager:get_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`
      );
    },
  },
  {
    name: "googleTagManager_create_variable",
    description: "Create a new variable in a GTM workspace",
    action: "googleTagManager:create_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Variable name"),
      type: z.string().describe("Variable type (e.g. 'v' for Data Layer, 'u' for URL, 'k' for 1st-party cookie, 'jsm' for custom JS)"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Variable parameters as GTM Parameter objects"),
      notes: z.string().optional().describe("Notes about the variable"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_variable",
    description: "Update an existing variable in a GTM workspace",
    action: "googleTagManager:update_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
      name: z.string().describe("Variable name"),
      type: z.string().describe("Variable type"),
      parameter: z.array(z.record(z.string(), z.unknown())).optional().describe("Variable parameters as GTM Parameter objects"),
      notes: z.string().optional().describe("Notes about the variable"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            type: params.type,
            parameter: params.parameter,
            notes: params.notes,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_variable",
    description: "Delete a variable from a GTM workspace",
    action: "googleTagManager:delete_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_variable",
    description: "Revert changes to a variable in a GTM workspace to the last synced state",
    action: "googleTagManager:revert_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      variableId: z.string().describe("The GTM variable ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/variables/${params.variableId}:revert`,
        { method: "POST" }
      );
    },
  },
  // Built-in Variables
  {
    name: "googleTagManager_list_built_in_variables",
    description: "List all enabled built-in variables in a GTM workspace",
    action: "googleTagManager:list_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables`
      );
    },
  },
  {
    name: "googleTagManager_enable_built_in_variables",
    description: "Enable one or more built-in variables in a GTM workspace",
    action: "googleTagManager:enable_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.array(z.string()).describe("Built-in variable types to enable (e.g. ['pageUrl', 'clickText', 'formId'])"),
    }),
    handler: async (params, context) => {
      const typeParams = (params.type as string[]).map((t) => `type=${encodeURIComponent(t)}`).join("&");
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables?${typeParams}`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_disable_built_in_variables",
    description: "Disable one or more built-in variables in a GTM workspace",
    action: "googleTagManager:disable_built_in_variables",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.array(z.string()).describe("Built-in variable types to disable"),
    }),
    handler: async (params, context) => {
      const typeParams = (params.type as string[]).map((t) => `type=${encodeURIComponent(t)}`).join("&");
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables?${typeParams}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_revert_built_in_variable",
    description: "Revert changes to a built-in variable in a GTM workspace",
    action: "googleTagManager:revert_built_in_variable",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      type: z.string().describe("Built-in variable type to revert"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/built_in_variables:revert?type=${encodeURIComponent(params.type as string)}`,
        { method: "POST" }
      );
    },
  },
  // Folders
  {
    name: "googleTagManager_list_folders",
    description: "List all folders in a GTM workspace",
    action: "googleTagManager:list_folders",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders`
      );
    },
  },
  {
    name: "googleTagManager_get_folder",
    description: "Get details of a specific folder in a GTM workspace",
    action: "googleTagManager:get_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`
      );
    },
  },
  {
    name: "googleTagManager_create_folder",
    description: "Create a new folder in a GTM workspace",
    action: "googleTagManager:create_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      name: z.string().describe("Folder name"),
      notes: z.string().optional().describe("Notes about the folder"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders`,
        {
          method: "POST",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_folder",
    description: "Update a folder in a GTM workspace",
    action: "googleTagManager:update_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
      name: z.string().describe("Folder name"),
      notes: z.string().optional().describe("Notes about the folder"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_folder",
    description: "Delete a folder from a GTM workspace",
    action: "googleTagManager:delete_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_get_folder_entities",
    description: "List all entities (tags, triggers, variables) in a GTM folder",
    action: "googleTagManager:get_folder_entities",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}:entities`
      );
    },
  },
  {
    name: "googleTagManager_move_entities_to_folder",
    description: "Move tags, triggers, and variables into a GTM folder",
    action: "googleTagManager:move_entities_to_folder",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      workspaceId: z.string().describe("The GTM workspace ID"),
      folderId: z.string().describe("The GTM folder ID"),
      tagId: z.array(z.string()).optional().describe("Tag IDs to move"),
      triggerId: z.array(z.string()).optional().describe("Trigger IDs to move"),
      variableId: z.array(z.string()).optional().describe("Variable IDs to move"),
    }),
    handler: async (params, context) => {
      const query = new URLSearchParams();
      if (params.tagId) (params.tagId as string[]).forEach((id) => query.append("tagId", id));
      if (params.triggerId) (params.triggerId as string[]).forEach((id) => query.append("triggerId", id));
      if (params.variableId) (params.variableId as string[]).forEach((id) => query.append("variableId", id));
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/workspaces/${params.workspaceId}/folders/${params.folderId}:move_entities_to_folder?${query.toString()}`,
        { method: "POST" }
      );
    },
  },
  // Versions
  {
    name: "googleTagManager_list_version_headers",
    description: "List all container version headers (metadata) in a GTM container",
    action: "googleTagManager:list_version_headers",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      includeDeleted: z.boolean().optional().describe("Include deleted versions"),
    }),
    handler: async (params, context) => {
      const query = params.includeDeleted ? "?includeDeleted=true" : "";
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/version_headers${query}`
      );
    },
  },
  {
    name: "googleTagManager_get_latest_version_header",
    description: "Get the latest container version header in a GTM container",
    action: "googleTagManager:get_latest_version_header",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/version_headers:latest`
      );
    },
  },
  {
    name: "googleTagManager_get_version",
    description: "Get full details of a specific GTM container version",
    action: "googleTagManager:get_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`
      );
    },
  },
  {
    name: "googleTagManager_get_live_version",
    description: "Get the currently published (live) version of a GTM container",
    action: "googleTagManager:get_live_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions:live`
      );
    },
  },
  {
    name: "googleTagManager_update_version",
    description: "Update the name or notes of a GTM container version",
    action: "googleTagManager:update_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
      name: z.string().optional().describe("Version name"),
      notes: z.string().optional().describe("Version notes"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: params.name, notes: params.notes }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_version",
    description: "Delete a GTM container version",
    action: "googleTagManager:delete_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_undelete_version",
    description: "Undelete a previously deleted GTM container version",
    action: "googleTagManager:undelete_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:undelete`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_publish_version",
    description: "Publish a GTM container version live",
    action: "googleTagManager:publish_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID to publish"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:publish`,
        { method: "POST" }
      );
    },
  },
  {
    name: "googleTagManager_set_latest_version",
    description: "Set a GTM container version as the latest version (without publishing)",
    action: "googleTagManager:set_latest_version",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      containerVersionId: z.string().describe("The container version ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/versions/${params.containerVersionId}:set_latest`,
        { method: "POST" }
      );
    },
  },
  // Environments
  {
    name: "googleTagManager_list_environments",
    description: "List all environments in a GTM container",
    action: "googleTagManager:list_environments",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments`
      );
    },
  },
  {
    name: "googleTagManager_get_environment",
    description: "Get details of a specific GTM environment",
    action: "googleTagManager:get_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`
      );
    },
  },
  {
    name: "googleTagManager_create_environment",
    description: "Create a new custom environment in a GTM container",
    action: "googleTagManager:create_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      name: z.string().describe("Environment name"),
      description: z.string().optional().describe("Environment description"),
      url: z.string().optional().describe("Default preview URL for this environment"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            url: params.url,
            type: "user",
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_environment",
    description: "Update a GTM environment",
    action: "googleTagManager:update_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
      name: z.string().optional().describe("Environment name"),
      description: z.string().optional().describe("Environment description"),
      url: z.string().optional().describe("Default preview URL"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: params.name,
            description: params.description,
            url: params.url,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_environment",
    description: "Delete a GTM environment",
    action: "googleTagManager:delete_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}`,
        { method: "DELETE" }
      );
    },
  },
  {
    name: "googleTagManager_reauthorize_environment",
    description: "Regenerate the authorization token for a GTM environment",
    action: "googleTagManager:reauthorize_environment",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      containerId: z.string().describe("The GTM container ID"),
      environmentId: z.string().describe("The GTM environment ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/containers/${params.containerId}/environments/${params.environmentId}:reauthorize`,
        { method: "POST" }
      );
    },
  },
  // User Permissions
  {
    name: "googleTagManager_list_user_permissions",
    description: "List all user permissions for a GTM account",
    action: "googleTagManager:list_user_permissions",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions`
      );
    },
  },
  {
    name: "googleTagManager_get_user_permission",
    description: "Get permission details for a specific user in a GTM account",
    action: "googleTagManager:get_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`
      );
    },
  },
  {
    name: "googleTagManager_create_user_permission",
    description: "Grant a user access to a GTM account",
    action: "googleTagManager:create_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      emailAddress: z.string().describe("Email address of the user to grant access"),
      accountAccess: z.object({
        permission: z.enum(["noAccess", "user", "admin"]).describe("Account-level permission"),
      }).describe("Account-level access settings"),
      containerAccess: z.array(z.object({
        containerId: z.string(),
        permission: z.enum(["noAccess", "read", "edit", "approve", "publish"]),
      })).optional().describe("Container-level access settings"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions`,
        {
          method: "POST",
          body: JSON.stringify({
            emailAddress: params.emailAddress,
            accountAccess: params.accountAccess,
            containerAccess: params.containerAccess,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_update_user_permission",
    description: "Update a user's permissions in a GTM account",
    action: "googleTagManager:update_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID"),
      accountAccess: z.object({
        permission: z.enum(["noAccess", "user", "admin"]).describe("Account-level permission"),
      }).describe("Account-level access settings"),
      containerAccess: z.array(z.object({
        containerId: z.string(),
        permission: z.enum(["noAccess", "read", "edit", "approve", "publish"]),
      })).optional().describe("Container-level access settings"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            accountAccess: params.accountAccess,
            containerAccess: params.containerAccess,
          }),
        }
      );
    },
  },
  {
    name: "googleTagManager_delete_user_permission",
    description: "Revoke a user's access from a GTM account",
    action: "googleTagManager:delete_user_permission",
    inputSchema: z.object({
      accountId: z.string().describe("The GTM account ID"),
      userPermissionId: z.string().describe("The user permission ID to revoke"),
    }),
    handler: async (params, context) => {
      return googleTagManagerFetch(
        context.serviceConnectionId,
        `/accounts/${params.accountId}/user_permissions/${params.userPermissionId}`,
        { method: "DELETE" }
      );
    },
  },
];

export function getToolsByActions(actions: string[]): ToolDefinition[] {
  const actionSet = new Set(actions);
  return TOOL_DEFINITIONS.filter((t) => actionSet.has(t.action));
}
