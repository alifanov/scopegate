import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/notion/callback`;
}

export async function exchangeNotionCodeForTokens(code: string, app: OAuthAppCreds) {
  const credentials = btoa(`${app.clientId}:${app.clientSecret}`);
  const res = await oauthFetch(
    "https://api.notion.com/v1/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(),
      }),
    },
    { label: "notion" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Notion token exchange failed", { status: res.status });
    throw new Error("Notion token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    workspace_id: string;
    workspace_name: string;
    bot_id: string;
    owner: {
      type: string;
      user?: {
        id: string;
        name?: string;
        person?: { email?: string };
      };
    };
  }>;
}
