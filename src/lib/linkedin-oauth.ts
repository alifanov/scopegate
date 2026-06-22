import { buildSignedState } from "@/lib/oauth-state";

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
  const state = buildSignedState({ projectId, provider: "linkedin", csrfToken });

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
    console.error("[ScopeGate] LinkedIn token exchange failed", { status: res.status });
    throw new Error("LinkedIn token exchange failed");
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
