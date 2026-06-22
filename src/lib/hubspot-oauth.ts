import { buildSignedState } from "@/lib/oauth-state";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID!;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET!;

const HUBSPOT_SCOPES =
  "crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write crm.objects.companies.read crm.objects.companies.write";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/hubspot/callback`;
}

export function buildHubSpotAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = buildSignedState({ projectId, provider: "hubspot", csrfToken });
  const params = new URLSearchParams({
    client_id: HUBSPOT_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: HUBSPOT_SCOPES,
    state,
  });
  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
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
