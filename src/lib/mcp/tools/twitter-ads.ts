import { z } from 'zod';
import { serviceJsonFetch } from '@/lib/mcp/service-fetch';
import { createFetchTool } from './fetch-tool';
import type { ToolDefinition } from './types';

export const twitterAdsTools: ToolDefinition[] = [
  // =====================
  // Twitter Ads tools
  // =====================
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_list_accounts",
    description: "List Twitter Ads accounts",
    action: "twitterAds:list_accounts",
    inputSchema: z.object({}),
    path: "/accounts",
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_get_account",
    description: "Get a Twitter Ads account",
    action: "twitterAds:get_account",
    inputSchema: z.object({ accountId: z.string() }),
    path: (params) => `/accounts/${params.accountId}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_list_campaigns",
    description: "List campaigns for a Twitter Ads account",
    action: "twitterAds:list_campaigns",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    path: (params) => `/accounts/${params.accountId}/campaigns`,
    query: (params) => ({ count: (params.count as number) ?? 50 }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_get_campaign",
    description: "Get a specific campaign",
    action: "twitterAds:get_campaign",
    inputSchema: z.object({
      accountId: z.string(),
      campaignId: z.string(),
    }),
    path: (params) => `/accounts/${params.accountId}/campaigns/${params.campaignId}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_list_line_items",
    description: "List line items (ad groups) for a Twitter Ads account",
    action: "twitterAds:list_line_items",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    path: (params) => `/accounts/${params.accountId}/line_items`,
    query: (params) => ({ count: (params.count as number) ?? 50 }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_get_line_item",
    description: "Get a specific line item",
    action: "twitterAds:get_line_item",
    inputSchema: z.object({
      accountId: z.string(),
      lineItemId: z.string(),
    }),
    path: (params) => `/accounts/${params.accountId}/line_items/${params.lineItemId}`,
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_list_promoted_tweets",
    description: "List promoted tweets for a Twitter Ads account",
    action: "twitterAds:list_promoted_tweets",
    inputSchema: z.object({
      accountId: z.string(),
      count: z.number().min(1).max(1000).optional().default(50),
    }),
    path: (params) => `/accounts/${params.accountId}/promoted_tweets`,
    query: (params) => ({ count: (params.count as number) ?? 50 }),
  }),
  createFetchTool(serviceJsonFetch, {
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
    path: (params) => `/stats/accounts/${params.accountId}`,
    query: (params) => ({
      entity: "CAMPAIGN",
      entity_ids: params.campaignIds as string,
      start_time: params.start_time as string,
      end_time: params.end_time as string,
      granularity: (params.granularity as string) || "DAY",
      metric_groups: "ENGAGEMENT",
    }),
  }),
  createFetchTool(serviceJsonFetch, {
    name: "twitterAds_update_campaign_status",
    description: "Update a campaign status",
    action: "twitterAds:update_campaign_status",
    inputSchema: z.object({
      accountId: z.string(),
      campaignId: z.string(),
      entity_status: z.enum(["ACTIVE", "PAUSED"]),
    }),
    path: (params) => `/accounts/${params.accountId}/campaigns/${params.campaignId}`,
    method: "PUT",
    body: (params) => ({ entity_status: params.entity_status }),
  }),
];
