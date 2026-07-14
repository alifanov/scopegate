const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID!;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/hubspot/callback`;
}

export async function exchangeHubSpotCodeForTokens(code: string) {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
    }),
  });

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
  const res = await fetch(
    `https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`
  );
  if (!res.ok) throw new Error("Failed to fetch HubSpot user info");
  return res.json() as Promise<{
    user: string;
    hub_id: number;
    hub_domain: string;
  }>;
}
