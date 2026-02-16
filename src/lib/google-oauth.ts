import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const GOOGLE_SCOPES: Record<string, string> = {
  gmail: "https://www.googleapis.com/auth/gmail.modify",
  calendar: "https://www.googleapis.com/auth/calendar",
  drive: "https://www.googleapis.com/auth/drive",
  googleAds: "https://www.googleapis.com/auth/adwords",
  searchConsole: "https://www.googleapis.com/auth/webmasters",
};

export const VALID_PROVIDERS = Object.keys(GOOGLE_SCOPES);

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/google/callback`;
}

export function buildGoogleAuthUrl(
  projectId: string,
  provider: string,
  csrfToken: string
): string {
  const state = btoa(JSON.stringify({ projectId, provider, csrfToken }));
  const scope = GOOGLE_SCOPES[provider];

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: `openid email ${scope}`,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Token exchange failed:", text);
    throw new Error("Token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] Token refresh failed:", text);
    throw new Error("Token refresh failed");
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function getGoogleUserEmail(
  accessToken: string
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = (await res.json()) as { email: string };
  return data.email;
}

export async function getValidAccessToken(
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

  const decryptedRefreshToken = decrypt(connection.refreshToken);
  const tokens = await refreshAccessToken(decryptedRefreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db.serviceConnection.update({
    where: { id: serviceConnectionId },
    data: {
      accessToken: encrypt(tokens.access_token),
      expiresAt,
    },
  });

  return tokens.access_token;
}
