import { buildSignedState } from "@/lib/oauth-state";
import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/meta/callback`;
}

export function buildMetaAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = buildSignedState({ projectId, provider: "metaAds", csrfToken });
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: getRedirectUri(),
    scope: "ads_read,ads_management",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCodeForTokens(code: string) {
  // Step 1: Exchange code for short-lived token
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    redirect_uri: getRedirectUri(),
    code,
  });
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
  );
  if (!res.ok) {
    console.error("[ScopeGate] Meta token exchange failed", { status: res.status });
    throw new Error("Meta token exchange failed");
  }
  const shortLived = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // Step 2: Exchange for long-lived token (60 days)
  const llParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    fb_exchange_token: shortLived.access_token,
  });
  const llRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${llParams.toString()}`
  );
  if (!llRes.ok) {
    // Fall back to short-lived
    return shortLived;
  }
  return (await llRes.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export async function getMetaUserInfo(
  accessToken: string
): Promise<{ name: string; email: string; id: string }> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error("Failed to fetch Meta user info");
  return res.json() as Promise<{
    name: string;
    email: string;
    id: string;
  }>;
}

export function getValidMetaAccessToken(serviceConnectionId: string): Promise<string> {
  return getValidAccessToken(serviceConnectionId);
}
