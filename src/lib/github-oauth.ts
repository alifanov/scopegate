import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;

const GITHUB_SCOPES = "repo read:user user:email";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/github/callback`;
}

export function buildGitHubAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = btoa(
    JSON.stringify({ projectId, provider: "github", csrfToken })
  );
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: GITHUB_SCOPES,
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCodeForTokens(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ScopeGate] GitHub token exchange failed:", text);
    throw new Error(`GitHub token exchange failed (${res.status}): ${text}`);
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
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch GitHub user info");
  return res.json() as Promise<{
    login: string;
    email: string | null;
    name: string | null;
  }>;
}

export async function getValidGitHubAccessToken(
  serviceConnectionId: string
): Promise<string> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  // GitHub tokens don't expire (unless expiration is enabled on the app)
  return decrypt(connection.accessToken);
}
