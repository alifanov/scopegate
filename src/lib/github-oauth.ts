import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import { oauthFetch } from "@/lib/oauth-fetch";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/github/callback`;
}

export async function exchangeGitHubCodeForTokens(code: string, app: OAuthAppCreds) {
  const res = await oauthFetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        code,
        redirect_uri: getRedirectUri(),
      }),
    },
    { label: "github" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] GitHub token exchange failed", { status: res.status });
    throw new Error("GitHub token exchange failed");
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    throw new Error(
      `GitHub OAuth error: ${data.error}: ${data.error_description}`
    );
  }

  return data;
}

export async function getGitHubUserInfo(
  accessToken: string
): Promise<{ login: string; email: string | null; name: string | null }> {
  const res = await oauthFetch(
    "https://api.github.com/user",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
    { label: "github" }
  );
  if (!res.ok) throw new Error("Failed to fetch GitHub user info");
  return res.json() as Promise<{
    login: string;
    email: string | null;
    name: string | null;
  }>;
}
