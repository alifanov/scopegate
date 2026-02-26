import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;

const LINKEDIN_SCOPES = "openid profile email w_member_social";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/linkedin/callback`;
}

export function buildLinkedInAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = btoa(JSON.stringify({ projectId, provider: "linkedin", csrfToken }));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: LINKEDIN_SCOPES,
    state,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCodeForTokens(code: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] LinkedIn token exchange failed:", text);
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  }>;
}

export async function refreshLinkedInAccessToken(refreshToken: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] LinkedIn token refresh failed:", text);
    throw new Error(`LinkedIn token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
  }>;
}

export async function revokeLinkedInToken(_token: string): Promise<void> {
  // LinkedIn does not provide a public token revocation API.
  // Tokens are simply deleted from the database on disconnect.
  console.log("[ScopeGate] LinkedIn token revocation: no-op (no revocation API available)");
}

export async function getLinkedInUserInfo(
  accessToken: string
): Promise<{ email: string; sub: string; name?: string }> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch LinkedIn user info");
  }

  const data = (await res.json()) as {
    sub: string;
    email: string;
    name?: string;
  };
  return data;
}

export async function getValidLinkedInAccessToken(
  serviceConnectionId: string
): Promise<string> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  // If token expires within 5 minutes, refresh it
  const bufferMs = 5 * 60 * 1000;
  const needsRefresh =
    !connection.expiresAt ||
    connection.expiresAt.getTime() < Date.now() + bufferMs;

  if (!needsRefresh) {
    return decrypt(connection.accessToken);
  }

  if (!connection.refreshToken) {
    throw new Error("No refresh token available for this LinkedIn connection");
  }
  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const tokens = await refreshLinkedInAccessToken(decryptedRefreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const updateData: { accessToken: string; expiresAt: Date; refreshToken?: string } = {
    accessToken: encrypt(tokens.access_token),
    expiresAt,
  };

  // LinkedIn may return a new refresh token
  if (tokens.refresh_token) {
    updateData.refreshToken = encrypt(tokens.refresh_token);
  }

  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      ...updateData,
      status: "active",
      lastError: null,
    },
  });

  return tokens.access_token;
}
