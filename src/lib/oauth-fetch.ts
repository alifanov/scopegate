import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { getProviderDef } from "@/lib/provider-registry";

// Shared transport for OAuth/credential HTTP calls — the credential-acquisition
// half of MCP's outbound traffic (authorization-code exchange, token refresh,
// user-info lookups, API-key validation) that service-fetch.ts/safe-fetch.ts
// (the tool-call half) doesn't cover. Every call gets a hard AbortSignal.timeout
// so a hung upstream (Slack, Notion, Jira, ...) can't hold an
// /api/oauth/*/callback route open indefinitely, and emits the same CLIENT-span
// shape service-fetch.ts already uses for tool calls.
const tracer = trace.getTracer("scopegate/oauth-fetch");

const DEFAULT_OAUTH_TIMEOUT_MS = 10_000;

export type OAuthFetchOptions = {
  timeoutMs?: number;
  // Provider registry key (e.g. "github", "metaAds") — used as the mcp.provider
  // span attribute and, when timeoutMs isn't given explicitly, to resolve a
  // per-provider override via ProviderDef.oauthTimeoutMs. Not every caller maps
  // to a registry key one-to-one (e.g. Google's code exchange is shared across
  // several google-* providers) — pass a descriptive label in that case; it's
  // used for observability only, a registry miss just falls through to the
  // default timeout.
  label: string;
};

export async function oauthFetch(
  url: string,
  init: RequestInit = {},
  opts: OAuthFetchOptions
): Promise<Response> {
  const timeoutMs =
    opts.timeoutMs ?? getProviderDef(opts.label)?.oauthTimeoutMs ?? DEFAULT_OAUTH_TIMEOUT_MS;
  const parsed = new URL(url);

  return tracer.startActiveSpan(
    `oauth-fetch ${opts.label}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.method": init.method ?? "GET",
        "mcp.provider": opts.label,
        "url.path": parsed.pathname,
        "peer.service": parsed.hostname,
      },
    },
    async (span) => {
      try {
        const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
        span.setAttribute("http.status_code", res.status);
        if (!res.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.status}` });
        }
        return res;
      } catch (err) {
        const message = err instanceof Error ? err.message : "OAuth request failed";
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        span.recordException(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        span.end();
      }
    }
  );
}
