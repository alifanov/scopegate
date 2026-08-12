import { oauthFetch } from "@/lib/oauth-fetch";
import { safeFetch } from "@/lib/mcp/safe-fetch";

const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID!;
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET!;
const SALESFORCE_USERINFO_TIMEOUT_MS = 10_000;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/salesforce/callback`;
}

export async function exchangeSalesforceCodeForTokens(code: string) {
  const res = await oauthFetch(
    "https://login.salesforce.com/services/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(),
      }),
    },
    { label: "salesforce" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Salesforce token exchange failed", { status: res.status });
    throw new Error("Salesforce token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    instance_url: string;
    id: string;
    token_type: string;
  }>;
}

// idUrl comes from the token response body, not a hardcoded host — goes
// through the SSRF-safe transport rather than oauthFetch's bare fetch().
export async function getSalesforceUserInfo(
  accessToken: string,
  idUrl: string
): Promise<{ email: string; display_name: string }> {
  const res = await safeFetch(idUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: SALESFORCE_USERINFO_TIMEOUT_MS,
  });
  if (!res.ok) throw new Error("Failed to fetch Salesforce user info");
  return res.json() as Promise<{
    email: string;
    display_name: string;
  }>;
}
