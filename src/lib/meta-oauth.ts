import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/meta/callback`;
}

export async function exchangeMetaCodeForTokens(code: string, app: OAuthAppCreds) {
  // Step 1: Exchange code for short-lived token (POST body keeps secrets out of URL)
  const res = await oauthFetch(
    "https://graph.facebook.com/v21.0/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        redirect_uri: getRedirectUri(),
        code,
      }),
    },
    { label: "metaAds" }
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
  const llRes = await oauthFetch(
    "https://graph.facebook.com/v21.0/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: app.clientId,
        client_secret: app.clientSecret,
        fb_exchange_token: shortLived.access_token,
      }),
    },
    { label: "metaAds" }
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
  const res = await oauthFetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`,
    {},
    { label: "metaAds" }
  );
  if (!res.ok) throw new Error("Failed to fetch Meta user info");
  return res.json() as Promise<{
    name: string;
    email: string;
    id: string;
  }>;
}
