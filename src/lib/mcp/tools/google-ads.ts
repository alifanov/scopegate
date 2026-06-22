import { z } from 'zod';
import { googleAdsQuery, googleAdsMutate, googleAdsApplyRecommendation, googleAdsDismissRecommendation, getGoogleAdsCustomerId } from '../google-ads';
import type { ToolDefinition } from './types';
function buildDateCondition(params: Record<string, unknown>): string {
    if (params.dateRangeStart && params.dateRangeEnd) {
        return `segments.date BETWEEN '${params.dateRangeStart}' AND '${params.dateRangeEnd}'`;
    }
    if (params.datePreset) {
        return `segments.date DURING ${params.datePreset}`;
    }
    return "segments.date DURING LAST_30_DAYS";
}
class GaqlBuilder {
    private conditions: string[] = [];
    private orderClause?: string;
    private limitClause?: number;
    constructor(private readonly fields: string[], private readonly resource: string) { }
    where(condition: string | false | null | undefined) {
        if (condition)
            this.conditions.push(condition);
        return this;
    }
    date(params: Record<string, unknown>) {
        return this.where(buildDateCondition(params));
    }
    orderBy(orderClause: string) {
        this.orderClause = orderClause;
        return this;
    }
    limit(limit: unknown, fallback: number) {
        this.limitClause = typeof limit === "number" ? limit : fallback;
        return this;
    }
    toString() {
        const parts = [`SELECT ${this.fields.join(", ")} FROM ${this.resource}`];
        if (this.conditions.length > 0) {
            parts.push(`WHERE ${this.conditions.join(" AND ")}`);
        }
        if (this.orderClause) {
            parts.push(`ORDER BY ${this.orderClause}`);
        }
        if (this.limitClause !== undefined) {
            parts.push(`LIMIT ${this.limitClause}`);
        }
        return parts.join(" ");
    }
}
// Google Ads GAQL validation helpers — prevents GAQL injection via AI-agent parameters
const gaqlNumericId = z.string().regex(/^\d+$/, "Must be a numeric Google Ads ID");
const gaqlDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
const gaqlDatePreset = z.enum([
    "TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_14_DAYS", "LAST_30_DAYS", "LAST_90_DAYS",
    "LAST_BUSINESS_WEEK", "THIS_WEEK_SUN_TODAY", "THIS_WEEK_MON_TODAY",
    "LAST_WEEK_SUN_SAT", "LAST_WEEK_MON_SUN", "THIS_MONTH", "LAST_MONTH", "ALL_TIME",
]);
const gaqlCampaignStatus = z.enum(["ENABLED", "PAUSED", "REMOVED"]);
const gaqlAdGroupStatus = z.enum(["ENABLED", "PAUSED", "REMOVED"]);
const gaqlAdStatus = z.enum(["ENABLED", "PAUSED", "DISABLED", "REMOVED"]);
const gaqlEnum = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Must be a valid Google Ads enum value");
export const googleAdsTools: ToolDefinition[] = [
    // Google Ads tools — Read: Campaigns
    {
        name: "googleAds_list_campaigns",
        description: "List campaigns in the Google Ads account",
        action: "googleAds:list_campaigns",
        inputSchema: z.object({
            status: gaqlCampaignStatus.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["campaign.id", "campaign.name", "campaign.status", "campaign.advertising_channel_type", "campaign.campaign_budget"], "campaign")
                .where(params.status ? `campaign.status = '${params.status}'` : null)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_get_campaign_performance",
        description: "Get performance metrics for a specific campaign",
        action: "googleAds:get_campaign_performance",
        inputSchema: z.object({
            campaignId: gaqlNumericId,
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["campaign.id", "campaign.name", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.ctr", "metrics.average_cpc", "segments.date"], "campaign")
                .where(`campaign.id = ${params.campaignId}`)
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Ad Groups
    {
        name: "googleAds_list_ad_groups",
        description: "List ad groups within a campaign",
        action: "googleAds:list_ad_groups",
        inputSchema: z.object({
            campaignId: gaqlNumericId,
            status: gaqlAdGroupStatus.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const query = new GaqlBuilder(["ad_group.id", "ad_group.name", "ad_group.status", "ad_group.campaign", "ad_group.cpc_bid_micros"], "ad_group")
                .where(`ad_group.campaign = 'customers/${cid}/campaigns/${params.campaignId}'`)
                .where(params.status ? `ad_group.status = '${params.status}'` : null)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_get_ad_group_performance",
        description: "Get performance metrics for a specific ad group",
        action: "googleAds:get_ad_group_performance",
        inputSchema: z.object({
            adGroupId: gaqlNumericId,
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["ad_group.id", "ad_group.name", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.ctr", "metrics.average_cpc", "segments.date"], "ad_group")
                .where(`ad_group.id = ${params.adGroupId}`)
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Ads
    {
        name: "googleAds_list_ads",
        description: "List ads within an ad group",
        action: "googleAds:list_ads",
        inputSchema: z.object({
            adGroupId: gaqlNumericId,
            status: gaqlAdStatus.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const query = new GaqlBuilder(["ad_group_ad.ad.id", "ad_group_ad.ad.type", "ad_group_ad.status", "ad_group_ad.ad.responsive_search_ad.headlines", "ad_group_ad.ad.responsive_search_ad.descriptions", "ad_group_ad.ad.final_urls"], "ad_group_ad")
                .where(`ad_group_ad.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}'`)
                .where(params.status ? `ad_group_ad.status = '${params.status}'` : null)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_get_ad_performance",
        description: "Get performance metrics for a specific ad",
        action: "googleAds:get_ad_performance",
        inputSchema: z.object({
            adGroupId: gaqlNumericId,
            adId: gaqlNumericId,
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const query = new GaqlBuilder(["ad_group_ad.ad.id", "ad_group_ad.ad_group", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.ctr", "segments.date"], "ad_group_ad")
                .where(`ad_group_ad.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}'`)
                .where(`ad_group_ad.ad.id = ${params.adId}`)
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Keywords
    {
        name: "googleAds_list_keywords",
        description: "List keywords in an ad group",
        action: "googleAds:list_keywords",
        inputSchema: z.object({
            adGroupId: gaqlNumericId,
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const query = new GaqlBuilder(["ad_group_criterion.criterion_id", "ad_group_criterion.keyword.text", "ad_group_criterion.keyword.match_type", "ad_group_criterion.status", "ad_group_criterion.cpc_bid_micros"], "ad_group_criterion")
                .where(`ad_group_criterion.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}'`)
                .where("ad_group_criterion.type = 'KEYWORD'")
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_get_keyword_performance",
        description: "Get performance metrics for a specific keyword",
        action: "googleAds:get_keyword_performance",
        inputSchema: z.object({
            adGroupId: gaqlNumericId,
            keywordId: gaqlNumericId,
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const query = new GaqlBuilder(["ad_group_criterion.criterion_id", "ad_group_criterion.keyword.text", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.quality_info.quality_score", "segments.date"], "ad_group_criterion")
                .where(`ad_group_criterion.ad_group = 'customers/${cid}/adGroups/${params.adGroupId}'`)
                .where(`ad_group_criterion.criterion_id = ${params.keywordId}`)
                .where("ad_group_criterion.type = 'KEYWORD'")
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Negative Keywords
    {
        name: "googleAds_list_negative_keywords",
        description: "List negative keywords. Provide campaignId for campaign-level negatives, or adGroupId for ad-group-level negatives.",
        action: "googleAds:list_negative_keywords",
        inputSchema: z.object({
            campaignId: gaqlNumericId.optional(),
            adGroupId: gaqlNumericId.optional(),
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
            campaignId: gaqlNumericId.optional(),
            adGroupId: gaqlNumericId.optional(),
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
            maxResults: z.number().optional().default(100),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["search_term_view.search_term", "search_term_view.ad_group", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "segments.date"], "search_term_view")
                .date(params)
                .where(params.campaignId ? `campaign.id = ${params.campaignId}` : null)
                .where(params.adGroupId ? `ad_group.id = ${params.adGroupId}` : null)
                .limit(params.maxResults, 100)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Account
    {
        name: "googleAds_get_account_overview",
        description: "Get an overview of the Google Ads account performance",
        action: "googleAds:get_account_overview",
        inputSchema: z.object({
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["customer.id", "customer.descriptive_name", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.ctr", "metrics.average_cpc", "segments.date"], "customer")
                .date(params)
                .toString();
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
            audienceId: gaqlNumericId,
            campaignId: gaqlNumericId.optional(),
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["campaign_audience_view.resource_name", "metrics.impressions", "metrics.clicks", "metrics.conversions", "metrics.cost_micros", "segments.date"], "campaign_audience_view")
                .where(`campaign_audience_view.resource_name LIKE '%${params.audienceId}%'`)
                .where(params.campaignId ? `campaign.id = ${params.campaignId}` : null)
                .date(params)
                .toString();
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
            conversionActionId: gaqlNumericId.optional(),
            campaignId: gaqlNumericId.optional(),
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            // conversion metrics must be queried from campaign/customer resource, not conversion_action
            const cid = params.conversionActionId
                ? await getGoogleAdsCustomerId(context.serviceConnectionId)
                : null;
            const fromResource = params.campaignId ? "campaign" : "customer";
            const query = new GaqlBuilder(["segments.conversion_action", "segments.conversion_action_name", "metrics.conversions", "metrics.conversions_value", "metrics.cost_per_conversion", "segments.date"], fromResource)
                .where(params.conversionActionId ? `segments.conversion_action = 'customers/${cid}/conversionActions/${params.conversionActionId}'` : null)
                .where(params.campaignId ? `campaign.id = ${params.campaignId}` : null)
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Extensions
    {
        name: "googleAds_list_extensions",
        description: "List ad extensions (sitelinks, callouts, structured snippets, etc.)",
        action: "googleAds:list_extensions",
        inputSchema: z.object({
            type: gaqlEnum.optional(),
            campaignId: gaqlNumericId.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["asset.id", "asset.type", "asset.name", "asset.sitelink_asset", "asset.callout_asset", "asset.structured_snippet_asset"], "asset")
                .where(params.type ? `asset.type = '${params.type}'` : null)
                .limit(params.maxResults, 50)
                .toString();
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
            budgetId: gaqlNumericId,
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
            bidStrategyId: gaqlNumericId,
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["bidding_strategy.id", "bidding_strategy.name", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "segments.date"], "bidding_strategy")
                .where(`bidding_strategy.id = ${params.bidStrategyId}`)
                .date(params)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Recommendations
    {
        name: "googleAds_list_recommendations",
        description: "List Google Ads optimization recommendations",
        action: "googleAds:list_recommendations",
        inputSchema: z.object({
            type: gaqlEnum.optional(),
            campaignId: gaqlNumericId.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const cid = params.campaignId
                ? await getGoogleAdsCustomerId(context.serviceConnectionId)
                : null;
            const query = new GaqlBuilder(["recommendation.resource_name", "recommendation.type", "recommendation.impact", "recommendation.campaign"], "recommendation")
                .where(params.type ? `recommendation.type = '${params.type}'` : null)
                .where(params.campaignId ? `recommendation.campaign = 'customers/${cid}/campaigns/${params.campaignId}'` : null)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    // Google Ads tools — Read: Change History
    {
        name: "googleAds_get_change_history",
        description: "Get change history for the account showing recent modifications",
        action: "googleAds:get_change_history",
        inputSchema: z.object({
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            resourceType: gaqlEnum.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["change_event.change_date_time", "change_event.change_resource_type", "change_event.resource_name", "change_event.old_resource", "change_event.new_resource", "change_event.user_email"], "change_event")
                .where(params.dateRangeStart && params.dateRangeEnd ? `change_event.change_date_time >= '${params.dateRangeStart}' AND change_event.change_date_time <= '${params.dateRangeEnd}'` : null)
                .where(params.resourceType ? `change_event.change_resource_type = '${params.resourceType}'` : null)
                .orderBy("change_event.change_date_time DESC")
                .limit(params.maxResults, 50)
                .toString();
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
            type: gaqlEnum.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["asset.id", "asset.type", "asset.name", "asset.final_urls"], "asset")
                .where(params.type ? `asset.type = '${params.type}'` : null)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_list_asset_groups",
        description: "List asset groups for Performance Max campaigns",
        action: "googleAds:list_asset_groups",
        inputSchema: z.object({
            campaignId: gaqlNumericId,
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
            campaignId: gaqlNumericId.optional(),
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
            maxResults: z.number().optional().default(50),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["geographic_view.country_criterion_id", "geographic_view.location_type", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "segments.date"], "geographic_view")
                .where(params.campaignId ? `campaign.id = ${params.campaignId}` : null)
                .date(params)
                .limit(params.maxResults, 50)
                .toString();
            return googleAdsQuery(context.serviceConnectionId, query);
        },
    },
    {
        name: "googleAds_get_device_performance",
        description: "Get performance metrics broken down by device type",
        action: "googleAds:get_device_performance",
        inputSchema: z.object({
            campaignId: gaqlNumericId.optional(),
            dateRangeStart: gaqlDate.optional(),
            dateRangeEnd: gaqlDate.optional(),
            datePreset: gaqlDatePreset.optional(),
        }),
        handler: async (params, context) => {
            const query = new GaqlBuilder(["segments.device", "metrics.impressions", "metrics.clicks", "metrics.cost_micros", "metrics.conversions", "metrics.ctr", "segments.date"], "campaign")
                .where(params.campaignId ? `campaign.id = ${params.campaignId}` : null)
                .date(params)
                .toString();
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
            type: gaqlEnum,
            status: gaqlCampaignStatus.optional().default("PAUSED"),
            budgetId: gaqlNumericId,
            biddingStrategyType: gaqlEnum.optional(),
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
            campaignId: gaqlNumericId,
            name: z.string().optional(),
            status: gaqlCampaignStatus.optional(),
            budgetId: gaqlNumericId.optional(),
            biddingStrategyType: gaqlEnum.optional(),
            targetCpa: z.number().optional(),
            targetRoas: z.number().optional(),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const campaign: Record<string, unknown> = {
                resourceName: `customers/${cid}/campaigns/${params.campaignId}`,
            };
            const updateMask: string[] = [];
            if (params.name) {
                campaign.name = params.name;
                updateMask.push("name");
            }
            if (params.status) {
                campaign.status = params.status;
                updateMask.push("status");
            }
            if (params.budgetId) {
                campaign.campaignBudget = `customers/${cid}/campaignBudgets/${params.budgetId}`;
                updateMask.push("campaign_budget");
            }
            if (params.biddingStrategyType) {
                campaign.biddingStrategyType = params.biddingStrategyType;
                updateMask.push("bidding_strategy_type");
            }
            if (params.targetCpa !== undefined) {
                campaign.targetCpa = { targetCpaMicros: params.targetCpa };
                updateMask.push("target_cpa");
            }
            if (params.targetRoas !== undefined) {
                campaign.targetRoas = { targetRoas: params.targetRoas };
                updateMask.push("target_roas");
            }
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
            campaignId: gaqlNumericId,
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
            campaignId: gaqlNumericId,
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
            campaignId: gaqlNumericId,
            name: z.string(),
            status: gaqlAdGroupStatus.optional().default("PAUSED"),
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
            adGroupId: gaqlNumericId,
            name: z.string().optional(),
            status: gaqlAdGroupStatus.optional(),
            cpcBidMicros: z.coerce.number().optional(),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const adGroup: Record<string, unknown> = {
                resourceName: `customers/${cid}/adGroups/${params.adGroupId}`,
            };
            const updateMask: string[] = [];
            if (params.name) {
                adGroup.name = params.name;
                updateMask.push("name");
            }
            if (params.status) {
                adGroup.status = params.status;
                updateMask.push("status");
            }
            if (params.cpcBidMicros !== undefined) {
                adGroup.cpcBidMicros = String(params.cpcBidMicros);
                updateMask.push("cpc_bid_micros");
            }
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
            adGroupId: gaqlNumericId,
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
            adGroupId: gaqlNumericId,
            headlines: z.array(z.string()).min(3).max(15),
            descriptions: z.array(z.string()).min(2).max(4),
            finalUrls: z.array(z.string()),
            path1: z.string().optional(),
            path2: z.string().optional(),
            status: gaqlAdStatus.optional().default("PAUSED"),
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
            adGroupId: gaqlNumericId,
            adId: gaqlNumericId,
            status: gaqlAdStatus.optional(),
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
            if (params.status) {
                adGroupAd.status = params.status;
                updateMask.push("status");
            }
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
            adGroupId: gaqlNumericId,
            adId: gaqlNumericId,
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
            adGroupId: gaqlNumericId,
            text: z.string(),
            matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
            cpcBidMicros: z.coerce.number().optional(),
            status: gaqlAdGroupStatus.optional().default("ENABLED"),
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
            adGroupId: gaqlNumericId,
            keywordId: gaqlNumericId,
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
            adGroupId: gaqlNumericId,
            keywordId: gaqlNumericId,
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
        description: "Add a negative keyword. Provide campaignId for campaign-level or adGroupId for ad-group-level negative keyword.",
        action: "googleAds:add_negative_keyword",
        inputSchema: z.object({
            campaignId: gaqlNumericId.optional(),
            adGroupId: gaqlNumericId.optional(),
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
                return googleAdsMutate(context.serviceConnectionId, "campaignCriteria", [
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
                ]);
            }
            throw new Error("Either campaignId or adGroupId is required");
        },
    },
    {
        name: "googleAds_remove_negative_keyword",
        description: "Remove a negative keyword. Provide campaignId for campaign-level or adGroupId for ad-group-level.",
        action: "googleAds:remove_negative_keyword",
        inputSchema: z.object({
            campaignId: gaqlNumericId.optional(),
            adGroupId: gaqlNumericId.optional(),
            keywordId: gaqlNumericId,
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
                return googleAdsMutate(context.serviceConnectionId, "campaignCriteria", [
                    {
                        remove: `customers/${cid}/campaignCriteria/${params.campaignId}~${params.keywordId}`,
                    },
                ]);
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
            budgetId: gaqlNumericId,
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
            if (params.description)
                label.description = params.description;
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
            labelId: gaqlNumericId,
            resourceType: z.enum(["campaign", "adGroup", "ad"]),
            resourceId: gaqlNumericId,
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const resourceType = params.resourceType as string;
            const resourceId = params.resourceId as string;
            const labelId = params.labelId as string;
            const resourceMap: Record<string, {
                mutateResource: string;
                field: string;
                resourcePath: string;
            }> = {
                campaign: { mutateResource: "campaignLabels", field: "campaign", resourcePath: `customers/${cid}/campaigns/${resourceId}` },
                adGroup: { mutateResource: "adGroupLabels", field: "adGroup", resourcePath: `customers/${cid}/adGroups/${resourceId}` },
                ad: { mutateResource: "adGroupAdLabels", field: "adGroupAd", resourcePath: `customers/${cid}/adGroupAds/${resourceId}` },
            };
            const config = resourceMap[resourceType];
            if (!config)
                throw new Error(`Invalid resource type: ${resourceType}`);
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
            campaignId: gaqlNumericId.optional().describe("Link to this campaign. If omitted, links to account level."),
            name: z.string().optional().describe("Internal asset name for reference"),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const sitelinkAsset: Record<string, unknown> = { linkText: params.linkText };
            if (params.description1)
                sitelinkAsset.description1 = params.description1;
            if (params.description2)
                sitelinkAsset.description2 = params.description2;
            const createResult = await googleAdsMutate(context.serviceConnectionId, "assets", [
                {
                    create: {
                        name: params.name ?? params.linkText,
                        type: "SITELINK",
                        finalUrls: [params.finalUrl],
                        sitelinkAsset,
                    },
                },
            ]) as {
                results?: Array<{
                    resourceName: string;
                }>;
            };
            const assetResourceName = createResult.results?.[0]?.resourceName;
            if (!assetResourceName)
                throw new Error("Failed to create sitelink asset");
            if (params.campaignId) {
                await googleAdsMutate(context.serviceConnectionId, "campaignAssets", [
                    { create: { campaign: `customers/${cid}/campaigns/${params.campaignId}`, asset: assetResourceName, fieldType: "SITELINK" } },
                ]);
            }
            else {
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
            campaignId: gaqlNumericId.optional().describe("Link to this campaign. If omitted, links to account level."),
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
            ]) as {
                results?: Array<{
                    resourceName: string;
                }>;
            };
            const assetResourceName = createResult.results?.[0]?.resourceName;
            if (!assetResourceName)
                throw new Error("Failed to create callout asset");
            if (params.campaignId) {
                await googleAdsMutate(context.serviceConnectionId, "campaignAssets", [
                    { create: { campaign: `customers/${cid}/campaigns/${params.campaignId}`, asset: assetResourceName, fieldType: "CALLOUT" } },
                ]);
            }
            else {
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
            assetId: gaqlNumericId,
            linkText: z.string().optional(),
            description1: z.string().optional(),
            description2: z.string().optional(),
            finalUrl: z.string().optional(),
        }),
        handler: async (params, context) => {
            const cid = await getGoogleAdsCustomerId(context.serviceConnectionId);
            const sitelinkAsset: Record<string, unknown> = {};
            const maskFields: string[] = [];
            if (params.linkText !== undefined) {
                sitelinkAsset.linkText = params.linkText;
                maskFields.push("sitelink_asset.link_text");
            }
            if (params.description1 !== undefined) {
                sitelinkAsset.description1 = params.description1;
                maskFields.push("sitelink_asset.description1");
            }
            if (params.description2 !== undefined) {
                sitelinkAsset.description2 = params.description2;
                maskFields.push("sitelink_asset.description2");
            }
            const updateObj: Record<string, unknown> = {
                resourceName: `customers/${cid}/assets/${params.assetId}`,
                sitelinkAsset,
            };
            if (params.finalUrl !== undefined) {
                updateObj.finalUrls = [params.finalUrl];
                maskFields.push("final_urls");
            }
            if (maskFields.length === 0)
                throw new Error("At least one field to update is required");
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
            assetId: gaqlNumericId,
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
            assetId: gaqlNumericId,
            fieldType: z.enum(["SITELINK", "CALLOUT"]),
            campaignId: gaqlNumericId.optional().describe("Remove from this campaign. If omitted, removes from account level."),
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
];
