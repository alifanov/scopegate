// Single source of truth for all OAuth/API-key providers.
// Each ProviderDef owns: token lifecycle config, transport config, permission actions.
// Consumers (oauth-token-lifecycle, service-fetch, permissions) derive their structures from here.

type ConnWithMeta = { metadata: unknown };

export type RefreshTokenConfig = {
  kind: "refresh";
  bufferMs: number;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  bodyFormat: "form" | "json";
  authStyle: "body" | "basic";
  timeoutMs?: number;
  defaultExpiresInMs?: number;
};

export type ExchangeTokenConfig = {
  kind: "exchange";
  bufferMs: number;
  exchangeType: "meta" | "threads";
};

export type TokenConfig =
  | { kind: "static" }
  | RefreshTokenConfig
  | ExchangeTokenConfig;

export type TransportDef = {
  baseUrl: string | ((conn: ConnWithMeta) => string);
  fixedHeaders?: Record<string, string>;
  timeoutMs?: number;
  retry?: {
    delaysMs: readonly number[];
    methods?: readonly string[];
    statusCodes?: readonly number[];
    retryNetworkErrors?: boolean;
  };
};

export type OAuthErrorClassification = {
  // Numeric signals (a provider API's error.code, or an HTTP status from a
  // live API call) that mean the access token is permanently dead — used by
  // classifyOAuthError() so this fact lives in one place instead of being
  // hardcoded per provider's *.ts file.
  permanentCodes?: readonly number[];
};

export type ProviderDef = {
  key: string;
  displayName: string;
  description: string;
  token: TokenConfig;
  transport?: TransportDef;
  actions: string[];
  oauthErrors?: OAuthErrorClassification;
};

// ─── Shared token configs ──────────────────────────────────────────────────────

const STATIC: TokenConfig = { kind: "static" };

const GOOGLE_REFRESH: RefreshTokenConfig = {
  kind: "refresh",
  bufferMs: 5 * 60 * 1000,
  tokenUrl: "https://oauth2.googleapis.com/token",
  clientIdEnv: "GOOGLE_CLIENT_ID",
  clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  bodyFormat: "form",
  authStyle: "body",
  timeoutMs: 10_000,
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PROVIDER_REGISTRY: ProviderDef[] = [
  // ── Google sub-providers ──────────────────────────────────────────────────
  {
    key: "gmail",
    displayName: "Gmail",
    description: "Access to Gmail operations",
    token: GOOGLE_REFRESH,
    transport: {
      baseUrl: "https://gmail.googleapis.com/gmail/v1",
      retry: {
        delaysMs: [1000, 2000, 4000],
        retryNetworkErrors: false,
      },
    },
    actions: [
      "gmail:read_emails",
      "gmail:send_email",
      "gmail:list_labels",
      "gmail:search_emails",
      "gmail:list_attachments",
      "gmail:get_attachment",
    ],
  },
  {
    key: "calendar",
    displayName: "Google Calendar",
    description: "Access to Google Calendar operations",
    token: GOOGLE_REFRESH,
    transport: { baseUrl: "https://www.googleapis.com/calendar/v3" },
    actions: [
      "calendar:list_events",
      "calendar:create_event",
      "calendar:update_event",
      "calendar:delete_event",
    ],
  },
  {
    key: "drive",
    displayName: "Google Drive",
    description: "Access to Google Drive operations",
    token: GOOGLE_REFRESH,
    actions: [
      "drive:list_files",
      "drive:read_file",
      "drive:create_file",
      "drive:delete_file",
    ],
  },
  {
    key: "googleAds",
    displayName: "Google Ads",
    description: "Access to Google Ads operations",
    token: GOOGLE_REFRESH,
    actions: [
      // Read - Campaigns
      "googleAds:list_campaigns",
      "googleAds:get_campaign_performance",
      // Read - Ad Groups
      "googleAds:list_ad_groups",
      "googleAds:get_ad_group_performance",
      // Read - Ads
      "googleAds:list_ads",
      "googleAds:get_ad_performance",
      // Read - Keywords
      "googleAds:list_keywords",
      "googleAds:get_keyword_performance",
      "googleAds:get_search_terms_report",
      // Read - Negative Keywords
      "googleAds:list_negative_keywords",
      // Read - Account
      "googleAds:get_account_overview",
      // Read - Audiences
      "googleAds:list_audiences",
      "googleAds:get_audience_performance",
      // Read - Conversions
      "googleAds:list_conversions",
      "googleAds:get_conversion_performance",
      // Read - Extensions
      "googleAds:list_extensions",
      // Read - Budgets & Bidding
      "googleAds:list_budgets",
      "googleAds:get_budget_details",
      "googleAds:list_bid_strategies",
      "googleAds:get_bid_strategy_performance",
      // Read - Recommendations
      "googleAds:list_recommendations",
      // Read - Change History
      "googleAds:get_change_history",
      // Read - Labels
      "googleAds:list_labels",
      // Read - Assets
      "googleAds:list_assets",
      "googleAds:list_asset_groups",
      // Read - Geo & Device Performance
      "googleAds:get_geo_performance",
      "googleAds:get_device_performance",
      // Write - Campaigns
      "googleAds:create_campaign",
      "googleAds:update_campaign",
      "googleAds:pause_campaign",
      "googleAds:enable_campaign",
      // Write - Ad Groups
      "googleAds:create_ad_group",
      "googleAds:update_ad_group",
      "googleAds:pause_ad_group",
      // Write - Ads
      "googleAds:create_ad",
      "googleAds:update_ad",
      "googleAds:pause_ad",
      // Write - Keywords
      "googleAds:add_keyword",
      "googleAds:remove_keyword",
      "googleAds:update_keyword_bid",
      // Write - Negative Keywords
      "googleAds:add_negative_keyword",
      "googleAds:remove_negative_keyword",
      // Write - Budgets
      "googleAds:update_budget",
      // Write - Recommendations
      "googleAds:apply_recommendation",
      "googleAds:dismiss_recommendation",
      // Write - Labels
      "googleAds:create_label",
      "googleAds:assign_label",
      // Write - Extensions
      "googleAds:create_sitelink",
      "googleAds:create_callout",
      "googleAds:update_sitelink",
      "googleAds:update_callout",
      "googleAds:remove_extension",
    ],
  },
  {
    key: "searchConsole",
    displayName: "Google Search Console",
    description: "Access to Google Search Console operations",
    token: GOOGLE_REFRESH,
    actions: [
      "searchConsole:list_sites",
      "searchConsole:get_site",
      "searchConsole:add_site",
      "searchConsole:delete_site",
      "searchConsole:query_analytics",
      "searchConsole:inspect_url",
      "searchConsole:list_sitemaps",
      "searchConsole:get_sitemap",
      "searchConsole:submit_sitemap",
      "searchConsole:delete_sitemap",
    ],
  },
  {
    key: "youtube",
    displayName: "YouTube",
    description: "Access to YouTube Data API operations",
    token: GOOGLE_REFRESH,
    transport: { baseUrl: "https://www.googleapis.com/youtube/v3" },
    actions: [
      "youtube:list_channels",
      "youtube:get_channel",
      "youtube:list_videos",
      "youtube:get_video",
      "youtube:upload_video",
      "youtube:update_video",
      "youtube:delete_video",
      "youtube:list_playlists",
      "youtube:get_playlist",
      "youtube:create_playlist",
      "youtube:update_playlist",
      "youtube:delete_playlist",
      "youtube:list_playlist_items",
      "youtube:add_playlist_item",
      "youtube:remove_playlist_item",
      "youtube:search",
      "youtube:list_comments",
      "youtube:add_comment",
      "youtube:delete_comment",
      "youtube:list_subscriptions",
      "youtube:get_analytics",
      "youtube:update_channel",
      "youtube:list_captions",
      "youtube:download_caption",
      "youtube:delete_caption",
      "youtube:list_channel_sections",
      "youtube:create_channel_section",
      "youtube:update_channel_section",
      "youtube:delete_channel_section",
      "youtube:list_comment_replies",
      "youtube:reply_to_comment",
      "youtube:update_comment",
      "youtube:set_comment_moderation",
      "youtube:list_languages",
      "youtube:list_regions",
      "youtube:list_members",
      "youtube:list_membership_levels",
      "youtube:update_playlist_item",
      "youtube:subscribe",
      "youtube:unsubscribe",
      "youtube:list_categories",
      "youtube:rate_video",
      "youtube:get_rating",
      "youtube:unset_watermark",
    ],
  },
  // ── OpenRouter ────────────────────────────────────────────────────────────
  {
    key: "openRouter",
    displayName: "OpenRouter",
    description: "Access to OpenRouter AI API",
    token: STATIC,
    transport: { baseUrl: "https://openrouter.ai/api/v1" },
    actions: [
      "openRouter:chat_completion",
      "openRouter:get_generation",
      "openRouter:list_models",
      "openRouter:get_model_endpoints",
      "openRouter:get_key_info",
      "openRouter:get_credits",
      "openRouter:get_activity",
      "openRouter:list_providers",
      "openRouter:create_embeddings",
    ],
  },
  // ── LinkedIn ──────────────────────────────────────────────────────────────
  {
    key: "linkedin",
    displayName: "LinkedIn",
    description: "Access to LinkedIn operations",
    token: {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      clientIdEnv: "LINKEDIN_CLIENT_ID",
      clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
      bodyFormat: "form",
      authStyle: "body",
    },
    transport: {
      baseUrl: "https://api.linkedin.com/rest",
      timeoutMs: 1_400,
      retry: {
        delaysMs: [150, 300],
        methods: ["GET"],
        retryNetworkErrors: true,
      },
      fixedHeaders: {
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202601",
      },
    },
    actions: [
      "linkedin:get_profile",
      "linkedin:create_post",
      "linkedin:delete_post",
      "linkedin:get_post",
      "linkedin:like_post",
      "linkedin:unlike_post",
      "linkedin:comment_on_post",
      "linkedin:get_post_comments",
    ],
  },
  // ── Twitter / X ───────────────────────────────────────────────────────────
  {
    key: "twitter",
    displayName: "Twitter / X",
    description: "Access to Twitter / X API",
    token: {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      tokenUrl: "https://api.x.com/2/oauth2/token",
      clientIdEnv: "TWITTER_CLIENT_ID",
      clientSecretEnv: "TWITTER_CLIENT_SECRET",
      bodyFormat: "form",
      authStyle: "basic",
    },
    transport: { baseUrl: "https://api.x.com/2" },
    // 401 on a live API call (after the token was already refreshed if needed)
    // means the token itself is invalid/revoked — not a transient blip.
    oauthErrors: { permanentCodes: [401] },
    actions: [
      "twitter:search_tweets",
      "twitter:get_tweet",
      "twitter:post_tweet",
      "twitter:delete_tweet",
      "twitter:get_me",
      "twitter:get_user",
      "twitter:get_user_tweets",
      "twitter:get_user_mentions",
      "twitter:like_tweet",
      "twitter:unlike_tweet",
      "twitter:retweet",
      "twitter:unretweet",
      "twitter:get_followers",
      "twitter:get_following",
      "twitter:follow_user",
      "twitter:unfollow_user",
      "twitter:mute_user",
      "twitter:unmute_user",
      "twitter:block_user",
      "twitter:unblock_user",
      "twitter:get_bookmarks",
      "twitter:bookmark_tweet",
      "twitter:unbookmark_tweet",
      "twitter:send_dm",
      "twitter:get_dm_events",
    ],
  },
  // ── Twitter Ads ───────────────────────────────────────────────────────────
  {
    key: "twitterAds",
    displayName: "Twitter / X Ads",
    description: "Access to Twitter / X Ads API",
    token: STATIC,
    transport: { baseUrl: "https://ads-api.x.com/12" },
    actions: [
      "twitterAds:list_accounts",
      "twitterAds:get_account",
      "twitterAds:list_campaigns",
      "twitterAds:get_campaign",
      "twitterAds:list_line_items",
      "twitterAds:get_line_item",
      "twitterAds:list_promoted_tweets",
      "twitterAds:get_campaign_stats",
      "twitterAds:update_campaign_status",
    ],
  },
  // ── Slack ─────────────────────────────────────────────────────────────────
  {
    key: "slack",
    displayName: "Slack",
    description: "Access to Slack operations",
    token: STATIC,
    transport: { baseUrl: "https://slack.com/api" },
    actions: [
      "slack:list_channels",
      "slack:post_message",
      "slack:get_channel_history",
      "slack:get_user_info",
      "slack:add_reaction",
      "slack:remove_reaction",
      "slack:list_users",
      "slack:upload_file",
    ],
  },
  // ── Notion ────────────────────────────────────────────────────────────────
  {
    key: "notion",
    displayName: "Notion",
    description: "Access to Notion operations",
    token: STATIC,
    transport: {
      baseUrl: "https://api.notion.com/v1",
      fixedHeaders: { "Notion-Version": "2022-06-28" },
    },
    actions: [
      "notion:search",
      "notion:get_page",
      "notion:create_page",
      "notion:update_page",
      "notion:get_database",
      "notion:query_database",
      "notion:create_database_item",
      "notion:get_block_children",
      "notion:append_block_children",
      "notion:delete_block",
      "notion:list_users",
    ],
  },
  // ── HubSpot ───────────────────────────────────────────────────────────────
  {
    key: "hubspot",
    displayName: "HubSpot",
    description: "Access to HubSpot CRM operations",
    token: {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      tokenUrl: "https://api.hubapi.com/oauth/v1/token",
      clientIdEnv: "HUBSPOT_CLIENT_ID",
      clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
      bodyFormat: "form",
      authStyle: "body",
    },
    transport: { baseUrl: "https://api.hubapi.com" },
    actions: [
      "hubspot:list_contacts",
      "hubspot:get_contact",
      "hubspot:create_contact",
      "hubspot:update_contact",
      "hubspot:search_contacts",
      "hubspot:list_deals",
      "hubspot:get_deal",
      "hubspot:create_deal",
      "hubspot:update_deal",
      "hubspot:list_companies",
      "hubspot:get_company",
      "hubspot:create_company",
      "hubspot:update_company",
      "hubspot:search_companies",
    ],
  },
  // ── GitHub ────────────────────────────────────────────────────────────────
  {
    key: "github",
    displayName: "GitHub",
    description: "Access to GitHub operations",
    token: STATIC,
    transport: {
      baseUrl: "https://api.github.com",
      fixedHeaders: { Accept: "application/vnd.github.v3+json" },
    },
    actions: [
      "github:list_repos",
      "github:get_repo",
      "github:list_issues",
      "github:get_issue",
      "github:create_issue",
      "github:update_issue",
      "github:list_pull_requests",
      "github:get_pull_request",
      "github:create_pull_request",
      "github:list_commits",
      "github:get_authenticated_user",
      "github:search_repos",
      "github:search_issues",
    ],
  },
  // ── Jira ──────────────────────────────────────────────────────────────────
  {
    key: "jira",
    displayName: "Jira",
    description: "Access to Jira project management",
    token: {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      clientIdEnv: "JIRA_CLIENT_ID",
      clientSecretEnv: "JIRA_CLIENT_SECRET",
      bodyFormat: "json",
      authStyle: "body",
    },
    transport: {
      baseUrl: (conn) => {
        const meta = conn.metadata as Record<string, string> | null;
        const cloudId = meta?.jiraCloudId;
        if (!cloudId) throw new Error("Jira cloud ID not found in service connection metadata");
        return `https://api.atlassian.com/ex/jira/${cloudId}`;
      },
    },
    actions: [
      "jira:list_projects",
      "jira:get_project",
      "jira:search_issues",
      "jira:get_issue",
      "jira:create_issue",
      "jira:update_issue",
      "jira:add_comment",
      "jira:list_sprints",
      "jira:get_transitions",
      "jira:transition_issue",
    ],
  },
  // ── Salesforce ────────────────────────────────────────────────────────────
  {
    key: "salesforce",
    displayName: "Salesforce",
    description: "Access to Salesforce CRM operations",
    token: {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      tokenUrl: "https://login.salesforce.com/services/oauth2/token",
      clientIdEnv: "SALESFORCE_CLIENT_ID",
      clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
      bodyFormat: "form",
      authStyle: "body",
      defaultExpiresInMs: 2 * 60 * 60 * 1000, // Salesforce doesn't return expires_in
    },
    transport: {
      baseUrl: (conn) => {
        const meta = conn.metadata as Record<string, string> | null;
        const instanceUrl = meta?.salesforceInstanceUrl;
        if (!instanceUrl)
          throw new Error("Salesforce instance URL not found in service connection metadata");
        return instanceUrl;
      },
    },
    actions: [
      "salesforce:query",
      "salesforce:get_record",
      "salesforce:create_record",
      "salesforce:update_record",
      "salesforce:delete_record",
      "salesforce:describe_object",
      "salesforce:list_objects",
      "salesforce:search",
    ],
  },
  // ── Meta Ads ──────────────────────────────────────────────────────────────
  {
    key: "metaAds",
    displayName: "Meta Ads",
    description: "Access to Facebook & Instagram Ads",
    token: { kind: "exchange", bufferMs: 24 * 60 * 60 * 1000, exchangeType: "meta" },
    // Meta Graph API error codes that mean an expired/revoked access token
    // (190, 102) or an invalidated session (463, 467).
    oauthErrors: { permanentCodes: [190, 102, 463, 467] },
    actions: [
      "metaAds:list_ad_accounts",
      "metaAds:get_ad_account",
      "metaAds:list_campaigns",
      "metaAds:get_campaign",
      "metaAds:get_campaign_insights",
      "metaAds:list_adsets",
      "metaAds:get_adset",
      "metaAds:get_adset_insights",
      "metaAds:list_ads",
      "metaAds:get_ad",
      "metaAds:get_ad_insights",
      "metaAds:get_account_insights",
      "metaAds:update_campaign_status",
      "metaAds:update_adset_status",
    ],
  },
  // ── Telegram ──────────────────────────────────────────────────────────────
  {
    key: "telegram",
    displayName: "Telegram",
    description: "Access to Telegram Bot API",
    token: STATIC,
    actions: [
      "telegram:send_message",
      "telegram:get_updates",
      "telegram:get_chat",
      "telegram:get_chat_members_count",
      "telegram:send_photo",
      "telegram:send_document",
      "telegram:pin_message",
      "telegram:unpin_message",
    ],
  },
  // ── SEMrush ───────────────────────────────────────────────────────────────
  {
    key: "semrush",
    displayName: "SEMrush",
    description: "Access to SEMrush SEO analytics",
    token: STATIC,
    actions: [
      "semrush:domain_overview",
      "semrush:domain_organic",
      "semrush:domain_organic_keywords",
      "semrush:keyword_overview",
      "semrush:keyword_difficulty",
      "semrush:backlinks_overview",
    ],
  },
  // ── Ahrefs ────────────────────────────────────────────────────────────────
  {
    key: "ahrefs",
    displayName: "Ahrefs",
    description: "Access to Ahrefs SEO analytics",
    token: STATIC,
    transport: {
      baseUrl: "https://api.ahrefs.com/v3",
      fixedHeaders: { Accept: "application/json" },
    },
    actions: [
      "ahrefs:domain_rating",
      "ahrefs:backlinks",
      "ahrefs:organic_keywords",
      "ahrefs:referring_domains",
      "ahrefs:subscription_info",
    ],
  },
  // ── Stripe ────────────────────────────────────────────────────────────────
  {
    key: "stripe",
    displayName: "Stripe",
    description: "Access to Stripe payment operations",
    token: STATIC,
    transport: { baseUrl: "https://api.stripe.com/v1" },
    actions: [
      "stripe:list_customers",
      "stripe:get_customer",
      "stripe:create_customer",
      "stripe:list_subscriptions",
      "stripe:get_subscription",
      "stripe:list_invoices",
      "stripe:get_invoice",
      "stripe:get_balance",
      "stripe:list_charges",
      "stripe:list_payment_intents",
    ],
  },
  // ── Airtable ──────────────────────────────────────────────────────────────
  {
    key: "airtable",
    displayName: "Airtable",
    description: "Access to Airtable operations",
    token: STATIC,
    transport: { baseUrl: "https://api.airtable.com/v0" },
    actions: [
      "airtable:list_bases",
      "airtable:get_base_schema",
      "airtable:list_records",
      "airtable:get_record",
      "airtable:create_record",
      "airtable:update_record",
      "airtable:delete_record",
    ],
  },
  // ── Calendly ──────────────────────────────────────────────────────────────
  {
    key: "calendly",
    displayName: "Calendly",
    description: "Access to Calendly scheduling",
    token: STATIC,
    transport: { baseUrl: "https://api.calendly.com" },
    actions: [
      "calendly:get_current_user",
      "calendly:list_event_types",
      "calendly:list_scheduled_events",
      "calendly:get_event",
      "calendly:list_invitees",
      "calendly:cancel_event",
    ],
  },
  // ── Threads ───────────────────────────────────────────────────────────────
  {
    key: "threads",
    displayName: "Threads",
    description: "Access to Threads (by Meta) operations",
    token: { kind: "exchange", bufferMs: 24 * 60 * 60 * 1000, exchangeType: "threads" },
    // Same Graph API family as Meta Ads — 190/102 mean an expired/revoked token.
    oauthErrors: { permanentCodes: [190, 102] },
    transport: {
      baseUrl: "https://graph.threads.net/v1.0",
      timeoutMs: 8_000,
      retry: {
        delaysMs: [250, 500],
        retryNetworkErrors: true,
      },
    },
    actions: [
      "threads:get_profile",
      "threads:get_threads",
      "threads:get_thread",
      "threads:publish_thread",
      "threads:delete_thread",
      "threads:get_replies",
      "threads:get_conversation",
      "threads:reply_to_thread",
      "threads:repost_thread",
      "threads:get_thread_insights",
      "threads:get_user_insights",
      "threads:get_publishing_limit",
      "threads:lookup_profile",
    ],
  },
  // ── Google Tag Manager ────────────────────────────────────────────────────
  {
    key: "googleTagManager",
    displayName: "Google Tag Manager",
    description: "Access to Google Tag Manager API operations",
    token: GOOGLE_REFRESH,
    transport: { baseUrl: "https://tagmanager.googleapis.com/tagmanager/v2" },
    actions: [
      // Accounts
      "googleTagManager:list_accounts",
      "googleTagManager:get_account",
      "googleTagManager:update_account",
      // Containers
      "googleTagManager:list_containers",
      "googleTagManager:get_container",
      "googleTagManager:create_container",
      "googleTagManager:update_container",
      "googleTagManager:delete_container",
      "googleTagManager:get_container_snippet",
      // Workspaces
      "googleTagManager:list_workspaces",
      "googleTagManager:get_workspace",
      "googleTagManager:create_workspace",
      "googleTagManager:update_workspace",
      "googleTagManager:delete_workspace",
      "googleTagManager:get_workspace_status",
      "googleTagManager:quick_preview_workspace",
      "googleTagManager:sync_workspace",
      "googleTagManager:resolve_workspace_conflict",
      "googleTagManager:create_version_from_workspace",
      // Tags
      "googleTagManager:list_tags",
      "googleTagManager:get_tag",
      "googleTagManager:create_tag",
      "googleTagManager:update_tag",
      "googleTagManager:delete_tag",
      "googleTagManager:revert_tag",
      // Triggers
      "googleTagManager:list_triggers",
      "googleTagManager:get_trigger",
      "googleTagManager:create_trigger",
      "googleTagManager:update_trigger",
      "googleTagManager:delete_trigger",
      "googleTagManager:revert_trigger",
      // Variables
      "googleTagManager:list_variables",
      "googleTagManager:get_variable",
      "googleTagManager:create_variable",
      "googleTagManager:update_variable",
      "googleTagManager:delete_variable",
      "googleTagManager:revert_variable",
      // Built-in Variables
      "googleTagManager:list_built_in_variables",
      "googleTagManager:enable_built_in_variables",
      "googleTagManager:disable_built_in_variables",
      "googleTagManager:revert_built_in_variable",
      // Folders
      "googleTagManager:list_folders",
      "googleTagManager:get_folder",
      "googleTagManager:create_folder",
      "googleTagManager:update_folder",
      "googleTagManager:delete_folder",
      "googleTagManager:get_folder_entities",
      "googleTagManager:move_entities_to_folder",
      // Versions
      "googleTagManager:list_version_headers",
      "googleTagManager:get_latest_version_header",
      "googleTagManager:get_version",
      "googleTagManager:get_live_version",
      "googleTagManager:update_version",
      "googleTagManager:delete_version",
      "googleTagManager:undelete_version",
      "googleTagManager:publish_version",
      "googleTagManager:set_latest_version",
      // Environments
      "googleTagManager:list_environments",
      "googleTagManager:get_environment",
      "googleTagManager:create_environment",
      "googleTagManager:update_environment",
      "googleTagManager:delete_environment",
      "googleTagManager:reauthorize_environment",
      // User Permissions
      "googleTagManager:list_user_permissions",
      "googleTagManager:get_user_permission",
      "googleTagManager:create_user_permission",
      "googleTagManager:update_user_permission",
      "googleTagManager:delete_user_permission",
    ],
  },
  // ── Email (IMAP/SMTP) ─────────────────────────────────────────────────────
  {
    key: "email",
    displayName: "Email (IMAP/SMTP)",
    description: "Access to email via IMAP/SMTP",
    token: STATIC,
    actions: [
      "email:list_mailboxes",
      "email:list_messages",
      "email:read_message",
      "email:search_messages",
      "email:send_message",
      "email:reply_message",
      "email:move_message",
      "email:delete_message",
      "email:mark_read",
    ],
  },
];

// ─── Derived lookups ──────────────────────────────────────────────────────────

export function getProviderDef(key: string): ProviderDef | undefined {
  return PROVIDER_REGISTRY.find((p) => p.key === key);
}

export const EXCHANGE_PROVIDER_KEYS: ReadonlySet<string> = new Set(
  PROVIDER_REGISTRY.filter((p) => p.token.kind === "exchange").map((p) => p.key)
);

export type OAuthCallbackRouteKey =
  | "github"
  | "google"
  | "hubspot"
  | "jira"
  | "linkedin"
  | "meta"
  | "notion"
  | "salesforce"
  | "slack"
  | "threads"
  | "twitter";
