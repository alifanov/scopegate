export interface PermissionGroup {
  name: string;
  description: string;
  actions: string[];
}

export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  gmail: {
    name: "Gmail",
    description: "Access to Gmail operations",
    actions: [
      "gmail:read_emails",
      "gmail:send_email",
      "gmail:list_labels",
      "gmail:search_emails",
    ],
  },
  calendar: {
    name: "Google Calendar",
    description: "Access to Google Calendar operations",
    actions: [
      "calendar:list_events",
      "calendar:create_event",
      "calendar:update_event",
      "calendar:delete_event",
    ],
  },
  drive: {
    name: "Google Drive",
    description: "Access to Google Drive operations",
    actions: [
      "drive:list_files",
      "drive:read_file",
      "drive:create_file",
      "drive:delete_file",
    ],
  },
  googleAds: {
    name: "Google Ads",
    description: "Access to Google Ads operations",
    actions: [
      "googleAds:list_campaigns",
      "googleAds:get_campaign_performance",
      "googleAds:list_ad_groups",
      "googleAds:get_ad_group_performance",
      "googleAds:list_keywords",
      "googleAds:get_keyword_performance",
      "googleAds:get_account_overview",
    ],
  },
  searchConsole: {
    name: "Google Search Console",
    description: "Access to Google Search Console operations",
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
  openRouter: {
    name: "OpenRouter",
    description: "Access to OpenRouter AI API",
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
  twitter: {
    name: "Twitter / X",
    description: "Access to Twitter / X API",
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
};

export const ALL_ACTIONS = Object.values(PERMISSION_GROUPS).flatMap(
  (g) => g.actions
);

export function getActionGroup(action: string): string | null {
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    if (group.actions.includes(action)) return key;
  }
  return null;
}
