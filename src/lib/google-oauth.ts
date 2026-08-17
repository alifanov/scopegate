import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { buildSignedState } from "@/lib/oauth-state";
import { oauthFetch } from "@/lib/oauth-fetch";

const GOOGLE_TOKEN_TIMEOUT_MS = 10_000;
const GOOGLE_USERINFO_TIMEOUT_MS = 5_000;
const GOOGLE_REVOKE_TIMEOUT_MS = 5_000;

const GOOGLE_SCOPES: Record<string, string> = {
  gmail: "https://www.googleapis.com/auth/gmail.modify",
  calendar: "https://www.googleapis.com/auth/calendar",
  drive: "https://www.googleapis.com/auth/drive",
  googleAds: "https://www.googleapis.com/auth/adwords",
  searchConsole: "https://www.googleapis.com/auth/webmasters",
  // youtube.force-ssl is required by the comments/commentThreads write endpoints —
  // the plain `youtube` scope is not accepted there (403 insufficientPermissions).
  youtube: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube.channel-memberships.creator",
  googleTagManager: "https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/tagmanager.delete.containers https://www.googleapis.com/auth/tagmanager.edit.containerversions https://www.googleapis.com/auth/tagmanager.publish https://www.googleapis.com/auth/tagmanager.manage.users https://www.googleapis.com/auth/tagmanager.manage.accounts",
};

export const VALID_PROVIDERS = Object.keys(GOOGLE_SCOPES);

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/google/callback`;
}

export function buildGoogleAuthUrl(
  projectId: string,
  provider: string,
  csrfToken: string,
  app: OAuthAppCreds
): string {
  const state = buildSignedState({ projectId, provider, csrfToken });
  const scope = GOOGLE_SCOPES[provider];

  const params = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: `openid email ${scope}`,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, app: OAuthAppCreds) {
  const res = await oauthFetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: app.clientId,
        client_secret: app.clientSecret,
        redirect_uri: getRedirectUri(),
        grant_type: "authorization_code",
      }),
    },
    { timeoutMs: GOOGLE_TOKEN_TIMEOUT_MS, label: "google" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Token exchange failed", { status: res.status });
    throw new Error("Token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    id_token?: string;
  }>;
}

// Decode email from id_token JWT payload — avoids a second network call to /userinfo.
// Safe: token was just received directly from Google's HTTPS token endpoint.
export function parseEmailFromIdToken(idToken: string): string | null {
  try {
    const payload = JSON.parse(
      atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    const res = await oauthFetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      { timeoutMs: GOOGLE_REVOKE_TIMEOUT_MS, label: "google" }
    );
    if (!res.ok) {
      console.warn("[ScopeGate] Google token revocation failed", { status: res.status });
    } else {
      console.log("[ScopeGate] Google token revoked successfully");
    }
  } catch (err) {
    console.warn("[ScopeGate] Google token revocation error:", err);
  }
}

export async function getGoogleUserEmail(
  accessToken: string
): Promise<string> {
  const res = await oauthFetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    { timeoutMs: GOOGLE_USERINFO_TIMEOUT_MS, label: "google" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = (await res.json()) as { email: string };
  return data.email;
}
