import { z } from 'zod';
import { twitterAdsFetch } from '../twitter-ads';
import type { ToolDefinition } from './types';

export const twitterAdsTools: ToolDefinition[] = [
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
];
