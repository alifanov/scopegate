import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import crypto from "crypto";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

const TWITTER_SCOPES = [
  "tweet.read",
  "tweet.write",
  "tweet.moderate",
  "users.read",
  "follows.read",
  "follows.write",
  "like.read",
  "like.write",
  "bookmark.read",
  "bookmark.write",
  "dm.read",
  "dm.write",
  "mute.read",
  "mute.write",
  "block.read",
  "block.write",
  "offline.access",
].join(" ");

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/twitter/callback`;
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildTwitterAuthUrl(
  projectId: string,
  provider: string,
  csrfToken: string,
  codeChallenge: string
): string {
  const state = btoa(JSON.stringify({ projectId, provider, csrfToken }));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: TWITTER_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://x.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitterCodeForTokens(code: string, codeVerifier: string) {
  const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Twitter token exchange failed:", text);
    throw new Error(`Twitter token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
    scope: string;
  }>;
}

export async function refreshTwitterAccessToken(refreshToken: string) {
  const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");

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

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Twitter token refresh failed:", text);
    throw new Error(`Twitter token refresh failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
    scope: string;
  }>;
}

export async function getTwitterUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; name: string }> {
  const res = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Twitter user info");
  }

  const json = (await res.json()) as { data: { id: string; username: string; name: string } };
  return json.data;
}

export async function getValidTwitterAccessToken(
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
    throw new Error("No refresh token available for this Twitter connection");
  }

  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const tokens = await refreshTwitterAccessToken(decryptedRefreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const updateData: { accessToken: string; expiresAt: Date; refreshToken?: string } = {
    accessToken: encrypt(tokens.access_token),
    expiresAt,
  };

  // Twitter rotates refresh tokens on each use
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
