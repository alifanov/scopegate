import type { OAuthAppCreds } from "@/lib/oauth-credentials";
import crypto from "crypto";
import { buildSignedState } from "@/lib/oauth-state";
import { oauthFetch } from "@/lib/oauth-fetch";


const TWITTER_SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "media.write",
  "follows.read",
  "follows.write",
  "like.read",
  "like.write",
  "bookmark.read",
  "bookmark.write",
  "mute.read",
  "mute.write",
  "block.read",
  "block.write",
  "offline.access",
].join(" ");

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/twitter/callback`;
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildTwitterAuthUrl(
  projectId: string,
  provider: string,
  csrfToken: string,
  codeChallenge: string,
  app: OAuthAppCreds
): string {
  const state = buildSignedState({ projectId, provider, csrfToken });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: app.clientId,
    redirect_uri: getRedirectUri(),
    scope: TWITTER_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://x.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitterCodeForTokens(
  code: string,
  codeVerifier: string,
  app: OAuthAppCreds,
) {
  const basicAuth = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString("base64");

  const res = await oauthFetch(
    "https://api.x.com/2/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(),
        code_verifier: codeVerifier,
      }),
    },
    { label: "twitter" }
  );

  if (!res.ok) {
    console.error("[ScopeGate] Twitter token exchange failed", { status: res.status });
    throw new Error("Twitter token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
    scope: string;
  }>;
}

export async function getTwitterUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; name: string }> {
  const res = await oauthFetch(
    "https://api.x.com/2/users/me",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    { label: "twitter" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Twitter user info");
  }

  const json = (await res.json()) as { data: { id: string; username: string; name: string } };
  return json.data;
}
