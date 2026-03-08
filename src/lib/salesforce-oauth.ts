import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID!;
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/salesforce/callback`;
}

export function buildSalesforceAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = btoa(
    JSON.stringify({ projectId, provider: "salesforce", csrfToken })
  );
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SALESFORCE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: "api refresh_token",
    state,
  });
  return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeSalesforceCodeForTokens(code: string) {
  const res = await fetch(
    "https://login.salesforce.com/services/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(),
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Salesforce token exchange failed:", text);
    throw new Error(
      `Salesforce token exchange failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    instance_url: string;
    id: string;
    token_type: string;
  }>;
}

export async function refreshSalesforceAccessToken(
  refreshToken: string
): Promise<{ access_token: string }> {
  const res = await fetch(
    "https://login.salesforce.com/services/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Salesforce token refresh failed:", text);
    throw new Error(
      `Salesforce token refresh failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<{ access_token: string }>;
}

export async function getSalesforceUserInfo(
  accessToken: string,
  idUrl: string
): Promise<{ email: string; display_name: string }> {
  const res = await fetch(idUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Salesforce user info");
  return res.json() as Promise<{
    email: string;
    display_name: string;
  }>;
}

export async function getValidSalesforceAccessToken(
  serviceConnectionId: string
): Promise<{ accessToken: string; instanceUrl: string }> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const metadata = connection.metadata as Record<string, string> | null;
  const instanceUrl = metadata?.salesforceInstanceUrl || "";

  // Salesforce tokens don't have a fixed expiry — they expire based on session settings.
  // Try the current token; if it fails the handler will catch the error.
  if (!connection.refreshToken) {
    return { accessToken: decrypt(connection.accessToken), instanceUrl };
  }

  const bufferMs = 5 * 60 * 1000;
  const needsRefresh =
    !connection.expiresAt ||
    connection.expiresAt.getTime() < Date.now() + bufferMs;

  if (!needsRefresh) {
    return { accessToken: decrypt(connection.accessToken), instanceUrl };
  }

  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const tokens = await refreshSalesforceAccessToken(decryptedRefreshToken);

  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      accessToken: encrypt(tokens.access_token),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // assume 2h
      status: "active",
      lastError: null,
    },
  });

  return { accessToken: tokens.access_token, instanceUrl };
}
