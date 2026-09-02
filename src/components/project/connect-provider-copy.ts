import type { ReactNode } from "react";

// ponytail: plain data, split out of services-tab.tsx so the dialog/forms
// that render it aren't sharing a module with 100+ lines of copy.

export const API_KEY_PLACEHOLDERS: Record<string, string> = {
  openRouter: "sk-or-...",
  stripe: "sk_live_... or sk_test_...",
  airtable: "pat...",
  calendly: "eyJ...",
  telegram: "123456:ABC-DEF...",
  semrush: "API key",
  ahrefs: "API key",
};

export const API_KEY_HELP: Record<string, ReactNode> = {};

// How to obtain a client ID / secret, per credential group (one app covers the
// whole group). Keyed by getCredentialGroup() — i.e. ProviderDef.connect.startRoute.
export const OAUTH_APP_SETUP: Record<string, { console: string; consoleLabel: string; steps: string[] }> = {
  google: {
    console: "https://console.cloud.google.com/apis/credentials",
    consoleLabel: "Google Cloud Console",
    steps: [
      "APIs & Services → OAuth consent screen. With a Workspace organisation pick user type Internal — it skips verification entirely and its refresh tokens never expire.",
      "Enable the APIs you plan to use: Gmail, Calendar, Drive, Google Ads, Search Console, YouTube Data v3, Tag Manager.",
      "Credentials → Create credentials → OAuth client ID → Web application.",
      "Add the redirect URI above under Authorised redirect URIs, then save.",
      "Copy Client ID and Client secret into the fields below.",
    ],
  },
  meta: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create app → type Business, then add the Marketing API product.",
      "Products → Facebook Login → Settings → add the redirect URI above to Valid OAuth Redirect URIs.",
      "Settings → Basic: copy App ID → Client ID, App secret → Client Secret.",
      "Development mode is enough while you use your own ad accounts; App Review is only needed for other people's.",
    ],
  },
  instagram: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create a separate app and add the Instagram product (it cannot share the Meta Ads app).",
      "Instagram → API setup → add the redirect URI above to the OAuth redirect URIs.",
      "Copy Instagram App ID → Client ID, Instagram App Secret → Client Secret.",
    ],
  },
  threads: {
    console: "https://developers.facebook.com/apps",
    consoleLabel: "Meta for Developers",
    steps: [
      "Create a separate app and add the Threads API product (its own app, not the Meta Ads one).",
      "Threads → Settings → add the redirect URI above to Redirect Callback URLs.",
      "Copy Threads App ID → Client ID, Threads App Secret → Client Secret.",
    ],
  },
  linkedin: {
    console: "https://www.linkedin.com/developers/apps",
    consoleLabel: "LinkedIn Developers",
    steps: [
      "Create app, link it to a LinkedIn Page and verify the page.",
      "Products → request Sign In with LinkedIn using OpenID Connect (instant) and Share on LinkedIn if you want to post.",
      "Auth → Authorized redirect URLs → add the redirect URI above.",
      "Copy Client ID and Primary Client Secret from the Auth tab.",
    ],
  },
  twitter: {
    console: "https://developer.x.com/en/portal/dashboard",
    consoleLabel: "X Developer Portal",
    steps: [
      "Create a project and an app (write access needs a paid API tier).",
      "App settings → User authentication settings → enable OAuth 2.0, type Web App / Automated App or Bot.",
      "Add the redirect URI above as the Callback URI, plus any website URL.",
      "Copy the OAuth 2.0 Client ID and Client Secret shown after saving.",
    ],
  },
  github: {
    console: "https://github.com/settings/developers",
    consoleLabel: "GitHub Developer settings",
    steps: [
      "OAuth Apps → New OAuth App.",
      "Authorization callback URL → paste the redirect URI above.",
      "Copy the Client ID, then Generate a new client secret and copy it.",
    ],
  },
  slack: {
    console: "https://api.slack.com/apps",
    consoleLabel: "Slack API",
    steps: [
      "Create New App → From scratch, pick your workspace.",
      "OAuth & Permissions → Redirect URLs → add the redirect URI above.",
      "Add the bot/user scopes you need, then install the app to the workspace.",
      "Basic Information → App Credentials: copy Client ID and Client Secret.",
    ],
  },
  notion: {
    console: "https://www.notion.so/my-integrations",
    consoleLabel: "Notion integrations",
    steps: [
      "New integration → type Public (a private integration has no OAuth flow).",
      "Fill in the required organisation name and URLs, add the redirect URI above.",
      "Copy the OAuth client ID and client secret from Secrets.",
    ],
  },
  hubspot: {
    console: "https://developers.hubspot.com/",
    consoleLabel: "HubSpot developer account",
    steps: [
      "Create a developer account, then Apps → Create app.",
      "Auth tab → add the redirect URI above and select the scopes you need.",
      "Copy Client ID and Client secret from the same Auth tab.",
    ],
  },
  jira: {
    console: "https://developer.atlassian.com/console/myapps/",
    consoleLabel: "Atlassian Developer Console",
    steps: [
      "Create → OAuth 2.0 integration.",
      "Permissions → add Jira API and the scopes you need.",
      "Authorization → OAuth 2.0 (3LO) → set the Callback URL to the redirect URI above.",
      "Settings → copy Client ID and Secret.",
    ],
  },
  salesforce: {
    console: "https://login.salesforce.com/",
    consoleLabel: "Salesforce Setup",
    steps: [
      "Setup → App Manager → New Connected App, enable OAuth settings.",
      "Callback URL → paste the redirect URI above; add the scopes api and refresh_token.",
      "After saving, Manage Consumer Details: Consumer Key → Client ID, Consumer Secret → Client Secret.",
    ],
  },
};
