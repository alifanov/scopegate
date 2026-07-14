import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { getValidAccessToken, OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";
import { getProviderDef } from "@/lib/provider-registry";

const META_API_BASE = "https://graph.facebook.com/v21.0";
// Meta error codes that indicate a dead token, defined once in PROVIDER_REGISTRY.
const META_TOKEN_ERROR_CODES = getProviderDef("metaAds")?.oauthErrors?.permanentCodes ?? [];
const tracer = trace.getTracer("scopegate");

type MetaGraphError = { error?: { code?: number; message?: string } };

export async function metaAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: { method?: string; body?: string; headers?: Record<string, string> }
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  // Meta uses token as a query parameter instead of an Authorization header
  const separator = path.includes("?") ? "&" : "?";
  const url = `${META_API_BASE}${path}${separator}access_token=${accessToken}`;
  const method = (init?.method ?? "GET").toUpperCase();

  return tracer.startActiveSpan(
    "service-fetch metaAds",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.method": method,
        "mcp.provider": "metaAds",
        "url.path": path,
      },
    },
    async (span) => {
      let spanStatusSet = false;
      try {
        const res = await safeFetch(url, {
          ...init,
          headers: { "Content-Type": "application/json", ...init?.headers },
        });

        span.setAttribute("http.status_code", res.status);

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as MetaGraphError;
          const errorCode = body?.error?.code;
          const errorMessage = body?.error?.message ?? "Meta Ads API request failed";
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.status}` });
          span.setAttribute("error.type", String(errorCode ?? res.status));
          spanStatusSet = true;
          if (errorCode !== undefined && META_TOKEN_ERROR_CODES.includes(errorCode)) {
            throw new OAuthTokenError(
              `Meta token expired or revoked (code ${errorCode}): ${errorMessage}`,
              { provider: "metaAds", code: errorCode }
            );
          }
          throw new Error(
            `Meta Ads API error (${res.status}) code=${errorCode}: ${errorMessage}`
          );
        }

        return res.json();
      } catch (err) {
        if (!spanStatusSet && !(err instanceof OAuthTokenError)) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
          span.recordException(err as Error);
        }
        throw err;
      } finally {
        span.end();
      }
    }
  );
}
