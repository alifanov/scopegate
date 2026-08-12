import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/slack/callback`;
}

export async function exchangeSlackCodeForTokens(code: string, app: OAuthAppCreds) {
  const res = await oauthFetch(
    "https://slack.com/api/oauth.v2.access",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: app.clientId,
        client_secret: app.clientSecret,
        redirect_uri: getRedirectUri(),
      }),
    },
    { label: "slack" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Slack token exchange failed", { status: res.status });
    throw new Error("Slack token exchange failed");
  }

  const data = (await res.json()) as {
    ok: boolean;
    access_token: string;
    team: { id: string; name: string };
    authed_user: { id: string };
    error?: string;
  };

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`);
  }

  return data;
}

export async function getSlackTeamInfo(
  accessToken: string
): Promise<{ team: string; user: string }> {
  const res = await oauthFetch(
    "https://slack.com/api/auth.test",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    { label: "slack" }
  );
  const data = (await res.json()) as {
    ok: boolean;
    team?: string;
    user?: string;
  };
  if (!data.ok) throw new Error("Failed to fetch Slack team info");
  return { team: data.team || "Slack", user: data.user || "" };
}
