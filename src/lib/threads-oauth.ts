import { oauthFetch } from "@/lib/oauth-fetch";
import { exchangeMetaLongLivedToken } from "@/lib/meta-token-exchange";

const THREADS_APP_ID = process.env.THREADS_APP_ID!;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET!;
const THREADS_SHORT_TOKEN_TIMEOUT_MS = 5_000;
const THREADS_LONG_TOKEN_TIMEOUT_MS = 650;

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/threads/callback`;
}

export async function exchangeThreadsCodeForTokens(code: string) {
  // Step 1: Exchange code for short-lived token
  const res = await oauthFetch(
    "https://graph.threads.net/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: THREADS_APP_ID,
        client_secret: THREADS_APP_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: getRedirectUri(),
      }),
    },
    { timeoutMs: THREADS_SHORT_TOKEN_TIMEOUT_MS, label: "threads" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Threads token exchange failed", { status: res.status });
    throw new Error("Threads token exchange failed");
  }

  const shortLived = (await res.json()) as {
    access_token: string;
    user_id: number;
  };

  // Step 2: Exchange for long-lived token (60 days), falling back to the
  // short-lived one on timeout or a non-ok response.
  return exchangeMetaLongLivedToken({
    host: "graph.threads.net",
    grantType: "th_exchange_token",
    appSecret: THREADS_APP_SECRET,
    shortLived,
    timeoutMs: THREADS_LONG_TOKEN_TIMEOUT_MS,
    label: "threads",
  });
}

export async function getThreadsUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; name?: string }> {
  const res = await oauthFetch(
    "https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    { label: "threads" }
  );
  if (!res.ok) throw new Error("Failed to fetch Threads user info");
  return res.json() as Promise<{
    id: string;
    username: string;
    name?: string;
  }>;
}
