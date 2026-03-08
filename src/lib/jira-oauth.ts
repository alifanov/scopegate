import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID!;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET!;

const JIRA_SCOPES = "read:jira-work write:jira-work read:jira-user offline_access";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/jira/callback`;
}

export function buildJiraAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = btoa(
    JSON.stringify({ projectId, provider: "jira", csrfToken })
  );
  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: JIRA_CLIENT_ID,
    scope: JIRA_SCOPES,
    redirect_uri: getRedirectUri(),
    state,
    response_type: "code",
    prompt: "consent",
  });
  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

export async function exchangeJiraCodeForTokens(code: string) {
  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Jira token exchange failed:", text);
    throw new Error(`Jira token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }>;
}

export async function refreshJiraAccessToken(refreshToken: string) {
  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Jira token refresh failed:", text);
    throw new Error(`Jira token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getJiraCloudInfo(
  accessToken: string
): Promise<{ cloudId: string; name: string; url: string }> {
  const res = await fetch(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch Jira cloud resources");
  const resources = (await res.json()) as Array<{
    id: string;
    name: string;
    url: string;
  }>;
  if (resources.length === 0) throw new Error("No Jira sites found");
  return {
    cloudId: resources[0].id,
    name: resources[0].name,
    url: resources[0].url,
  };
}

export async function getValidJiraAccessToken(
  serviceConnectionId: string
): Promise<string> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const bufferMs = 5 * 60 * 1000;
  const needsRefresh =
    !connection.expiresAt ||
    connection.expiresAt.getTime() < Date.now() + bufferMs;

  if (!needsRefresh) {
    return decrypt(connection.accessToken);
  }

  if (!connection.refreshToken) {
    throw new Error("No refresh token available for this Jira connection");
  }

  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const tokens = await refreshJiraAccessToken(decryptedRefreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt,
      status: "active",
      lastError: null,
    },
  });

  return tokens.access_token;
}
