import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";
import { exchangeMetaLongLivedToken } from "@/lib/meta-token-exchange";

// Instagram API with Instagram Login (Instagram Direct Login, July 2024):
// same short-lived -> long-lived token exchange shape as Threads, but on
// api.instagram.com / graph.instagram.com with ig_* grant types.
const INSTAGRAM_SHORT_TOKEN_TIMEOUT_MS = 5_000;
const INSTAGRAM_LONG_TOKEN_TIMEOUT_MS = 5_000;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/instagram/callback`;
}

export async function exchangeInstagramCodeForTokens(code: string, app: OAuthAppCreds) {
  // Step 1: exchange code for a short-lived token (1 hour).
  const res = await oauthFetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getRedirectUri(),
      }),
    },
    { timeoutMs: INSTAGRAM_SHORT_TOKEN_TIMEOUT_MS, label: "instagram" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Instagram token exchange failed", { status: res.status });
    throw new Error("Instagram token exchange failed");
  }

  // The endpoint returns either a flat object or { data: [ { ... } ] }.
  const raw = (await res.json()) as
    | { access_token: string; user_id: number | string }
    | { data: Array<{ access_token: string; user_id: number | string }> };
  const shortLived =
    "data" in raw && Array.isArray(raw.data) ? raw.data[0] : (raw as { access_token: string; user_id: number | string });

  // Step 2: exchange for a long-lived token (60 days), falling back to the
  // short-lived one on timeout or a non-ok response.
  return exchangeMetaLongLivedToken({
    host: "graph.instagram.com",
    grantType: "ig_exchange_token",
    appSecret: app.clientSecret,
    shortLived,
    timeoutMs: INSTAGRAM_LONG_TOKEN_TIMEOUT_MS,
    label: "instagram",
  });
}

export async function getInstagramUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; account_type?: string }> {
  const params = new URLSearchParams({
    fields: "id,username,account_type",
    access_token: accessToken,
  });
  const res = await oauthFetch(
    `https://graph.instagram.com/v21.0/me?${params.toString()}`,
    {},
    { label: "instagram" }
  );
  if (!res.ok) throw new Error("Failed to fetch Instagram user info");
  return res.json() as Promise<{ id: string; username: string; account_type?: string }>;
}
