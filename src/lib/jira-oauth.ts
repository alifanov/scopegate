const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID!;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/jira/callback`;
}

export async function exchangeJiraCodeForTokens(code: string) {
  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: JIRA_CLIENT_ID,
      client_secret: JIRA_CLIENT_SECRET,
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    console.error("[ScopeGate] Jira token exchange failed", { status: res.status });
    throw new Error("Jira token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }>;
}

export async function getJiraCloudInfo(
  accessToken: string
): Promise<{ cloudId: string; name: string; url: string }> {
  const res = await fetch(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch Jira cloud resources");
  const resources = (await res.json()) as Array<{
    id: string;
    name: string;
    url: string;
  }>;
  if (resources.length === 0) throw new Error("No Jira sites found");
  return {
    cloudId: resources[0].id,
    name: resources[0].name,
    url: resources[0].url,
  };
}
