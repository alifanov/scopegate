import { buildSignedState } from "@/lib/oauth-state";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_TOKEN_TIMEOUT_MS = 10_000;

export const GOOGLE_SCOPES: Record<string, string> = {
  gmail: "https://www.googleapis.com/auth/gmail.modify",
  calendar: "https://www.googleapis.com/auth/calendar",
  drive: "https://www.googleapis.com/auth/drive",
  googleAds: "https://www.googleapis.com/auth/adwords",
  searchConsole: "https://www.googleapis.com/auth/webmasters",
  youtube: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.channel-memberships.creator",
  googleTagManager: "https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/tagmanager.delete.containers https://www.googleapis.com/auth/tagmanager.edit.containerversions https://www.googleapis.com/auth/tagmanager.publish https://www.googleapis.com/auth/tagmanager.manage.users https://www.googleapis.com/auth/tagmanager.manage.accounts",
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
  const state = buildSignedState({ projectId, provider, csrfToken });
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
    signal: AbortSignal.timeout(GOOGLE_TOKEN_TIMEOUT_MS),
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    console.error("[ScopeGate] Token exchange failed", { status: res.status });
    throw new Error("Token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
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
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data = (await res.json()) as { email: string };
  return data.email;
}
