import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/hubspot/callback`;
}

export async function exchangeHubSpotCodeForTokens(code: string, app: OAuthAppCreds) {
  const res = await oauthFetch(
    "https://api.hubapi.com/oauth/v1/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: app.clientId,
        client_secret: app.clientSecret,
        redirect_uri: getRedirectUri(),
      }),
    },
    { label: "hubspot" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] HubSpot token exchange failed", { status: res.status });
    throw new Error("HubSpot token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getHubSpotUserInfo(
  accessToken: string
): Promise<{ user: string; hub_id: number; hub_domain: string }> {
  const res = await oauthFetch(
    `https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`,
    {},
    { label: "hubspot" }
  );
  if (!res.ok) throw new Error("Failed to fetch HubSpot user info");
  return res.json() as Promise<{
    user: string;
    hub_id: number;
    hub_domain: string;
  }>;
}
