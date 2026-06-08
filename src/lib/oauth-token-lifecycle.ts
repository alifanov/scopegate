import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const STATIC_PROVIDERS = new Set(["github", "slack", "notion"]);
const GOOGLE_PROVIDERS = new Set([
  "gmail",
  "calendar",
  "drive",
  "googleAds",
  "searchConsole",
  "youtube",
  "googleTagManager",
]);
// Providers that use the current access token (not a refresh_token) to obtain a new token
const EXCHANGE_PROVIDERS = new Set(["threads", "metaAds"]);

type StandardTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

type ProviderConfig =
  | { kind: "static" }
  | {
      kind: "refresh";
      bufferMs: number;
      doRefresh: (refreshToken: string) => Promise<StandardTokenResponse>;
    }
  | {
      kind: "exchange";
      bufferMs: number;
      // Returns null to signal graceful fallback (Meta); throws to signal failure (Threads)
      doExchange: (currentToken: string) => Promise<StandardTokenResponse | null>;
    };

function getProviderConfig(provider: string): ProviderConfig {
  if (STATIC_PROVIDERS.has(provider)) return { kind: "static" };

  if (GOOGLE_PROVIDERS.has(provider)) {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
          }),
        });
        if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  if (provider === "hubspot") {
    const clientId = process.env.HUBSPOT_CLIENT_ID!;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!res.ok) throw new Error(`HubSpot token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  if (provider === "jira") {
    const clientId = process.env.JIRA_CLIENT_ID!;
    const clientSecret = process.env.JIRA_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const res = await fetch("https://auth.atlassian.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
          }),
        });
        if (!res.ok) throw new Error(`Jira token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  if (provider === "linkedin") {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!res.ok) throw new Error(`LinkedIn token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  if (provider === "salesforce") {
    const clientId = process.env.SALESFORCE_CLIENT_ID!;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const res = await fetch("https://login.salesforce.com/services/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });
        if (!res.ok) throw new Error(`Salesforce token refresh failed (${res.status})`);
        const data = (await res.json()) as { access_token: string };
        // Salesforce doesn't return expires_in — assume 2 hours
        return { access_token: data.access_token, expires_in: 2 * 60 * 60 };
      },
    };
  }

  if (provider === "twitter") {
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    return {
      kind: "refresh",
      bufferMs: 5 * 60 * 1000,
      doRefresh: async (refreshToken) => {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const res = await fetch("https://api.x.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });
        if (!res.ok) throw new Error(`Twitter token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  if (provider === "metaAds") {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    return {
      kind: "exchange",
      bufferMs: 24 * 60 * 60 * 1000,
      doExchange: async (currentToken) => {
        try {
          const params = new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: currentToken,
          });
          const res = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?${params}`
          );
          if (!res.ok) return null;
          return res.json() as Promise<StandardTokenResponse>;
        } catch {
          return null;
        }
      },
    };
  }

  if (provider === "threads") {
    return {
      kind: "exchange",
      bufferMs: 24 * 60 * 60 * 1000,
      doExchange: async (currentToken) => {
        const params = new URLSearchParams({
          grant_type: "th_refresh_token",
          access_token: currentToken,
        });
        const res = await fetch(
          `https://graph.threads.net/refresh_access_token?${params}`
        );
        if (!res.ok) throw new Error(`Threads token refresh failed (${res.status})`);
        return res.json() as Promise<StandardTokenResponse>;
      },
    };
  }

  throw new Error(`Unknown OAuth provider: ${provider}`);
}

type DbConnection = Awaited<ReturnType<typeof db.serviceConnection.findUniqueOrThrow>>;

export async function getValidAccessToken(connectionId: string): Promise<string> {
  const conn = await db.serviceConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  return getValidAccessTokenForConnection(conn);
}

export async function getValidAccessTokenForConnection(conn: DbConnection): Promise<string> {
  const config = getProviderConfig(conn.provider);

  if (config.kind === "static") {
    return decrypt(conn.accessToken);
  }

  const needsRefresh =
    !conn.expiresAt || conn.expiresAt.getTime() < Date.now() + config.bufferMs;

  if (!needsRefresh) {
    return decrypt(conn.accessToken);
  }

  if (config.kind === "exchange") {
    const currentToken = decrypt(conn.accessToken);
    const result = await config.doExchange(currentToken);
    if (result === null) return currentToken; // graceful fallback (Meta)
    await db.serviceConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encrypt(result.access_token),
        expiresAt: new Date(Date.now() + result.expires_in * 1000),
        status: "active",
        lastError: null,
      },
    });
    return result.access_token;
  }

  // kind === "refresh"
  if (!conn.refreshToken) {
    throw new Error(
      `No refresh token available for connection ${conn.id} (${conn.provider})`
    );
  }
  const tokens = await config.doRefresh(decrypt(conn.refreshToken));
  const updateData: Record<string, unknown> = {
    accessToken: encrypt(tokens.access_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    status: "active",
    lastError: null,
  };
  if (tokens.refresh_token) {
    updateData.refreshToken = encrypt(tokens.refresh_token);
  }
  await db.serviceConnection.update({ where: { id: conn.id }, data: updateData });
  return tokens.access_token;
}

export type RefreshForCronOutcome = "refreshed" | "skipped";

export type CronConnection = {
  id: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

// Performs a proactive token refresh for cron use. Resets consecutiveFailures on success.
// Returns "skipped" for static tokens or when graceful exchange falls back.
// Throws on refresh failure — callers are expected to handle error state.
export async function refreshForCron(
  connection: CronConnection
): Promise<RefreshForCronOutcome> {
  const config = getProviderConfig(connection.provider);

  if (config.kind === "static") return "skipped";

  if (config.kind === "exchange") {
    const currentToken = decrypt(connection.accessToken);
    const result = await config.doExchange(currentToken);
    if (result === null) return "skipped"; // graceful fallback (Meta)
    await db.serviceConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: encrypt(result.access_token),
        expiresAt: new Date(Date.now() + result.expires_in * 1000),
        status: "active",
        lastError: null,
        consecutiveFailures: 0,
      },
    });
    return "refreshed";
  }

  // kind === "refresh"
  if (!connection.refreshToken) return "skipped";

  const tokens = await config.doRefresh(decrypt(connection.refreshToken));
  const updateData: Record<string, unknown> = {
    accessToken: encrypt(tokens.access_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    status: "active",
    lastError: null,
    consecutiveFailures: 0,
  };
  if (tokens.refresh_token) {
    updateData.refreshToken = encrypt(tokens.refresh_token);
  }
  await db.serviceConnection.update({ where: { id: connection.id }, data: updateData });
  return "refreshed";
}

export { EXCHANGE_PROVIDERS };
