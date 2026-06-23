import { buildSignedState } from "@/lib/oauth-state";
import { SpanStatusCode, trace } from "@opentelemetry/api";

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const META_TRACER_NAME = "scopegate.oauth.meta";

function getRedirectUri() {
  return `${process.env.BETTER_AUTH_URL}/api/oauth/meta/callback`;
}

export function buildMetaAuthUrl(
  projectId: string,
  csrfToken: string
): string {
  const state = buildSignedState({ projectId, provider: "metaAds", csrfToken });
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: getRedirectUri(),
    scope: "ads_read,ads_management",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

async function metaTokenFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  return trace.getTracer(META_TRACER_NAME).startActiveSpan(
    `GET graph.facebook.com`,
    async (span) => {
      span.setAttribute("peer.service", "graph.facebook.com");
      span.setAttribute("url.path", path);

      try {
        // Params passed via init.body (POST) so no secrets in the URL here
        const res = await fetch(`https://graph.facebook.com${path}`, init);

        span.setAttribute("http.status_code", res.status);

        if (!res.ok) {
          let errorCode: string | undefined;
          let errorType: string | undefined;
          try {
            const body = (await res.clone().json()) as {
              error?: { code?: number; type?: string; message?: string };
            };
            errorCode = body.error?.code?.toString();
            errorType = body.error?.type;
            if (errorCode) span.setAttribute("error.code", errorCode);
            if (errorType) span.setAttribute("error.type", errorType);
          } catch {
            // non-JSON body — skip attribute
          }
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.status}` });
        }

        return res;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Meta token request failed",
        });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

export async function exchangeMetaCodeForTokens(code: string) {
  // Step 1: Exchange code for short-lived token (POST body keeps secrets out of URL)
  const res = await metaTokenFetch("/v21.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: getRedirectUri(),
      code,
    }),
  });
  if (!res.ok) {
    console.error("[ScopeGate] Meta token exchange failed", { status: res.status });
    throw new Error("Meta token exchange failed");
  }
  const shortLived = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // Step 2: Exchange for long-lived token (60 days)
  const llRes = await metaTokenFetch("/v21.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: shortLived.access_token,
    }),
  });
  if (!llRes.ok) {
    // Fall back to short-lived
    return shortLived;
  }
  return (await llRes.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export async function getMetaUserInfo(
  accessToken: string
): Promise<{ name: string; email: string; id: string }> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error("Failed to fetch Meta user info");
  return res.json() as Promise<{
    name: string;
    email: string;
    id: string;
  }>;
}
