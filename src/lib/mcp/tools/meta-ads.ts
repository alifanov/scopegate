import { z } from 'zod';
import { metaAdsFetch } from '../meta-ads';
import type { ToolDefinition } from './types';

export const metaAdsTools: ToolDefinition[] = [
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
];
