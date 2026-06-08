import { buildSignedState } from "@/lib/oauth-state";
import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";

const THREADS_APP_ID = process.env.THREADS_APP_ID!;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET!;

const THREADS_SCOPES =
  "threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies,threads_manage_insights,threads_delete";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/threads/callback`;
}

export function buildThreadsAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = buildSignedState({ projectId, provider: "threads", csrfToken });
  const params = new URLSearchParams({
    client_id: THREADS_APP_ID,
    redirect_uri: getRedirectUri(),
    scope: THREADS_SCOPES,
    response_type: "code",
    state,
  });
  return `https://threads.net/oauth/authorize?${params.toString()}`;
}

export async function exchangeThreadsCodeForTokens(code: string) {
  // Step 1: Exchange code for short-lived token
  const res = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: THREADS_APP_ID,
      client_secret: THREADS_APP_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    console.error("[ScopeGate] Threads token exchange failed", { status: res.status });
    throw new Error("Threads token exchange failed");
  }

  const shortLived = (await res.json()) as {
    access_token: string;
    user_id: number;
  };

  // Step 2: Exchange for long-lived token (60 days)
  const llParams = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: THREADS_APP_SECRET,
    access_token: shortLived.access_token,
  });
  const llRes = await fetch(
    `https://graph.threads.net/access_token?${llParams.toString()}`
  );

  if (!llRes.ok) {
    // Fall back to short-lived (1 hour)
    return {
      access_token: shortLived.access_token,
      user_id: shortLived.user_id,
      expires_in: 3600,
    };
  }

  const longLived = (await llRes.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  return {
    access_token: longLived.access_token,
    user_id: shortLived.user_id,
    expires_in: longLived.expires_in,
  };
}

export async function getThreadsUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; name?: string }> {
  const res = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch Threads user info");
  return res.json() as Promise<{
    id: string;
    username: string;
    name?: string;
  }>;
}

export function getValidThreadsAccessToken(serviceConnectionId: string): Promise<string> {
  return getValidAccessToken(serviceConnectionId);
}
