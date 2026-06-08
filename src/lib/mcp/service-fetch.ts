import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";
import { safeFetch, type SafeFetchOptions } from "@/lib/mcp/safe-fetch";

type DbConnection = Awaited<ReturnType<typeof db.serviceConnection.findUniqueOrThrow>>;

type ProviderTransportConfig = {
  baseUrl: string | ((conn: DbConnection) => string);
  fixedHeaders?: Record<string, string>;
};

const TRANSPORT_CONFIGS: Record<string, ProviderTransportConfig> = {
  slack: { baseUrl: "https://slack.com/api" },
  github: {
    baseUrl: "https://api.github.com",
    fixedHeaders: { Accept: "application/vnd.github.v3+json" },
  },
  twitter: { baseUrl: "https://api.x.com/2" },
  twitterAds: { baseUrl: "https://ads-api.x.com/12" },
  linkedin: {
    baseUrl: "https://api.linkedin.com/rest",
    fixedHeaders: {
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202601",
    },
  },
  hubspot: { baseUrl: "https://api.hubapi.com" },
  jira: {
    baseUrl: (conn) => {
      const meta = conn.metadata as Record<string, string> | null;
      const cloudId = meta?.jiraCloudId;
      if (!cloudId) throw new Error("Jira cloud ID not found in service connection metadata");
      return `https://api.atlassian.com/ex/jira/${cloudId}`;
    },
  },
  notion: {
    baseUrl: "https://api.notion.com/v1",
    fixedHeaders: { "Notion-Version": "2022-06-28" },
  },
  salesforce: {
    baseUrl: (conn) => {
      const meta = conn.metadata as Record<string, string> | null;
      const instanceUrl = meta?.salesforceInstanceUrl;
      if (!instanceUrl)
        throw new Error("Salesforce instance URL not found in service connection metadata");
      return instanceUrl;
    },
  },
  threads: { baseUrl: "https://graph.threads.net/v1.0" },
  calendar: { baseUrl: "https://www.googleapis.com/calendar/v3" },
  googleTagManager: { baseUrl: "https://tagmanager.googleapis.com/tagmanager/v2" },
  youtube: { baseUrl: "https://www.googleapis.com/youtube/v3" },
  ahrefs: {
    baseUrl: "https://api.ahrefs.com/v3",
    fixedHeaders: { Accept: "application/json" },
  },
  airtable: { baseUrl: "https://api.airtable.com/v0" },
  calendly: { baseUrl: "https://api.calendly.com" },
  stripe: { baseUrl: "https://api.stripe.com/v1" },
  openRouter: { baseUrl: "https://openrouter.ai/api/v1" },
};

export type ServiceFetchOptions = Omit<SafeFetchOptions, "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Unified service transport: resolves the access token once, applies
 * provider-specific base URL and fixed headers, then routes through
 * safeFetch (SSRF-protected). Returns the raw Response for caller-defined
 * response handling.
 */
export async function serviceFetch(
  connectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<Response> {
  const conn = await db.serviceConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const config = TRANSPORT_CONFIGS[conn.provider];
  if (!config) {
    throw new Error(`No transport config for provider: ${conn.provider}`);
  }

  const accessToken = await getValidAccessTokenForConnection(conn);
  const baseUrl =
    typeof config.baseUrl === "function" ? config.baseUrl(conn) : config.baseUrl;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...config.fixedHeaders,
    ...init?.headers,
  };

  return safeFetch(`${baseUrl}${path}`, { ...init, headers });
}
