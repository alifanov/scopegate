import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";

const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID!;
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/salesforce/callback`;
}

export async function exchangeSalesforceCodeForTokens(code: string) {
  const res = await fetch(
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
    }
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

export async function getSalesforceUserInfo(
  accessToken: string,
  idUrl: string
): Promise<{ email: string; display_name: string }> {
  const res = await fetch(idUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Salesforce user info");
  return res.json() as Promise<{
    email: string;
    display_name: string;
  }>;
}

export async function getValidSalesforceAccessToken(
  serviceConnectionId: string
): Promise<{ accessToken: string; instanceUrl: string }> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const metadata = connection.metadata as Record<string, string> | null;
  const instanceUrl = metadata?.salesforceInstanceUrl ?? "";
  const accessToken = await getValidAccessTokenForConnection(connection);
  return { accessToken, instanceUrl };
}
