import { SpanStatusCode, trace } from "@opentelemetry/api";

// Instagram API with Instagram Login (Instagram Direct Login, July 2024):
// same short-lived -> long-lived token exchange shape as Threads, but on
// api.instagram.com / graph.instagram.com with ig_* grant types.
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const INSTAGRAM_SHORT_TOKEN_TIMEOUT_MS = 5_000;
const INSTAGRAM_LONG_TOKEN_TIMEOUT_MS = 5_000;
const INSTAGRAM_TRACER_NAME = "scopegate.oauth.instagram";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/instagram/callback`;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

async function fetchInstagramToken(
  url: string,
  init: RequestInit & { timeoutMs: number }
): Promise<Response> {
  const parsed = new URL(url);
  const { timeoutMs, ...fetchInit } = init;
  return trace.getTracer(INSTAGRAM_TRACER_NAME).startActiveSpan(
    `${init.method ?? "GET"} ${parsed.hostname}`,
    async (span) => {
      span.setAttribute("peer.service", parsed.hostname);
      span.setAttribute("url.path", parsed.pathname);
      span.setAttribute("instagram.timeout_ms", timeoutMs);

      try {
        return await fetch(url, {
          ...fetchInit,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Instagram token request failed",
        });
        if (isTimeoutError(error)) {
          console.warn("[ScopeGate] Instagram token request timed out", {
            path: parsed.pathname,
            timeoutMs,
          });
        }
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

export async function exchangeInstagramCodeForTokens(code: string) {
  // Step 1: exchange code for a short-lived token (1 hour).
  const res = await fetchInstagramToken("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
    timeoutMs: INSTAGRAM_SHORT_TOKEN_TIMEOUT_MS,
  });

  if (!res.ok) {
    console.error("[ScopeGate] Instagram token exchange failed", { status: res.status });
    throw new Error("Instagram token exchange failed");
  }

  // The endpoint returns either a flat object or { data: [ { ... } ] }.
  const raw = (await res.json()) as
    | { access_token: string; user_id: number | string }
    | { data: Array<{ access_token: string; user_id: number | string }> };
  const shortLived =
    "data" in raw && Array.isArray(raw.data) ? raw.data[0] : (raw as { access_token: string; user_id: number | string });

  // Step 2: exchange for a long-lived token (60 days).
  const llParams = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: INSTAGRAM_APP_SECRET,
    access_token: shortLived.access_token,
  });
  let llRes: Response;
  try {
    llRes = await fetchInstagramToken(
      `https://graph.instagram.com/access_token?${llParams.toString()}`,
      { timeoutMs: INSTAGRAM_LONG_TOKEN_TIMEOUT_MS }
    );
  } catch (error) {
    if (!isTimeoutError(error)) throw error;
    return {
      access_token: shortLived.access_token,
      user_id: shortLived.user_id,
      expires_in: 3600,
    };
  }

  if (!llRes.ok) {
    // Fall back to the short-lived token (1 hour).
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

export async function getInstagramUserInfo(
  accessToken: string
): Promise<{ id: string; username: string; account_type?: string }> {
  const params = new URLSearchParams({
    fields: "id,username,account_type",
    access_token: accessToken,
  });
  const res = await fetch(`https://graph.instagram.com/v21.0/me?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch Instagram user info");
  return res.json() as Promise<{ id: string; username: string; account_type?: string }>;
}
