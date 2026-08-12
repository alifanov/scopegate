import { oauthFetch } from "@/lib/oauth-fetch";

// Meta's short-lived → long-lived token exchange (step 2 of the OAuth code
// flow) is byte-identical across every Meta Graph API surface — only the
// host, grant_type and app secret differ. Shared by instagram-oauth.ts and
// threads-oauth.ts, including the "fall back to the short-lived token on a
// timeout or a non-ok response" behavior both callers need identically.
export type MetaLongLivedExchangeParams = {
  host: string;
  grantType: string;
  appSecret: string;
  shortLived: { access_token: string; user_id: number | string };
  timeoutMs: number;
  label: string;
};

export type MetaTokenResult = {
  access_token: string;
  user_id: number | string;
  expires_in: number;
};

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

export async function exchangeMetaLongLivedToken(
  params: MetaLongLivedExchangeParams
): Promise<MetaTokenResult> {
  const { host, grantType, appSecret, shortLived, timeoutMs, label } = params;
  const query = new URLSearchParams({
    grant_type: grantType,
    client_secret: appSecret,
    access_token: shortLived.access_token,
  });
  // Short-lived tokens last 1 hour — the safe fallback whenever the
  // long-lived exchange fails or times out.
  const fallback: MetaTokenResult = {
    access_token: shortLived.access_token,
    user_id: shortLived.user_id,
    expires_in: 3600,
  };

  let res: Response;
  try {
    res = await oauthFetch(
      `https://${host}/access_token?${query.toString()}`,
      {},
      { timeoutMs, label }
    );
  } catch (error) {
    if (!isTimeoutError(error)) throw error;
    console.warn(`[ScopeGate] ${host} long-lived token exchange timed out`, { timeoutMs });
    return fallback;
  }

  if (!res.ok) return fallback;

  const longLived = (await res.json()) as {
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
