const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/slack/callback`;
}

export async function exchangeSlackCodeForTokens(code: string) {
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
    }),
  });

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
  const res = await fetch("https://slack.com/api/auth.test", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as {
    ok: boolean;
    team?: string;
    user?: string;
  };
  if (!data.ok) throw new Error("Failed to fetch Slack team info");
  return { team: data.team || "Slack", user: data.user || "" };
}
