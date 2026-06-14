import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";
import { safeFetch, type SafeFetchOptions } from "@/lib/mcp/safe-fetch";
import { PROVIDER_REGISTRY } from "@/lib/provider-registry";

const tracer = trace.getTracer("scopegate");

type DbConnection = Awaited<ReturnType<typeof db.serviceConnection.findUniqueOrThrow>>;

type ProviderTransportConfig = {
  baseUrl: string | ((conn: DbConnection) => string);
  fixedHeaders?: Record<string, string>;
};

const TRANSPORT_CONFIGS: Record<string, ProviderTransportConfig> = Object.fromEntries(
  PROVIDER_REGISTRY.filter((p) => p.transport !== undefined).map((p) => [p.key, p.transport!])
);

export type ServiceFetchOptions = Omit<SafeFetchOptions, "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Unified service transport: resolves the access token once, applies
 * provider-specific base URL and fixed headers, then routes through
 * safeFetch (SSRF-protected). Returns the raw Response for caller-defined
 * response handling.
 */
export async function serviceFetch(
  connectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<Response> {
  const conn = await db.serviceConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const config = TRANSPORT_CONFIGS[conn.provider];
  if (!config) {
    throw new Error(`No transport config for provider: ${conn.provider}`);
  }

  const accessToken = await getValidAccessTokenForConnection(conn);
  const baseUrl =
    typeof config.baseUrl === "function" ? config.baseUrl(conn) : config.baseUrl;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...config.fixedHeaders,
    ...init?.headers,
  };

  const method = (init?.method ?? "GET").toUpperCase();

  return tracer.startActiveSpan(
    `service-fetch ${conn.provider}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "http.route": `${conn.provider}${path}`,
        "http.method": method,
        "mcp.provider": conn.provider,
        "url.path": path,
      },
    },
    async (span) => {
      try {
        const res = await safeFetch(`${baseUrl}${path}`, { ...init, headers });
        span.setAttribute("http.status_code", res.status);
        if (res.status >= 400) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.status}` });
        }
        return res;
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
        span.recordException(err as Error);
        throw err;
      } finally {
        span.end();
      }
    }
  );
}
