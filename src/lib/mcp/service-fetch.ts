import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";
import { safeFetch, type SafeFetchOptions } from "@/lib/mcp/safe-fetch";
import { PROVIDER_REGISTRY } from "@/lib/provider-registry";
import type { TransportDef } from "@/lib/provider-registry";
import { isRetriableNetworkError, retry as retryOperation, retryAfterDelayMs } from "@/lib/mcp/retry";

const tracer = trace.getTracer("scopegate");

type DbConnection = Awaited<ReturnType<typeof db.serviceConnection.findUniqueOrThrow>>;

type ProviderTransportConfig = Omit<TransportDef, "baseUrl" | "altBaseUrls"> & {
  baseUrl: string | ((conn: DbConnection) => string);
  altBaseUrls?: Record<string, string | ((conn: DbConnection) => string)>;
};

const TRANSPORT_CONFIGS: Record<string, ProviderTransportConfig> = Object.fromEntries(
  PROVIDER_REGISTRY.filter((p) => p.transport !== undefined).map((p) => [p.key, p.transport!])
);

function resolveUrl(
  value: string | ((conn: DbConnection) => string),
  conn: DbConnection
): string {
  return typeof value === "function" ? value(conn) : value;
}

export type ServiceFetchOptions = Omit<SafeFetchOptions, "headers"> & {
  headers?: Record<string, string>;
  retry?: boolean;
  onAttempt?: (attempt: number) => void;
  // Selects an entry from the provider's transport.altBaseUrls instead of
  // the default baseUrl (e.g. LinkedIn's OIDC v2 host, GSC's v1 host).
  baseUrlKey?: string;
};

/**
 * Unified service transport: resolves the access token once, applies
 * provider-specific base URL and fixed headers, then routes through
 * safeFetch (SSRF-protected). Returns the raw Response for caller-defined
 * response handling.
 */
export async function serviceFetch(
  connectionId: string,
  rawPath: string,
  init?: ServiceFetchOptions
): Promise<Response> {
  const { retry: retryOverride, onAttempt, baseUrlKey, ...fetchInit } = init ?? {};
  const conn = await db.serviceConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const config = TRANSPORT_CONFIGS[conn.provider];
  if (!config) {
    throw new Error(`No transport config for provider: ${conn.provider}`);
  }

  const accessToken = await getValidAccessTokenForConnection(conn);
  const altBaseUrl = baseUrlKey ? config.altBaseUrls?.[baseUrlKey] : undefined;
  const baseUrl = resolveUrl(altBaseUrl ?? config.baseUrl, conn);
  const fixedHeaders =
    typeof config.fixedHeaders === "function" ? config.fixedHeaders() : config.fixedHeaders;

  const isQueryAuth = config.auth?.location === "query";
  const headers: Record<string, string> = {
    ...(isQueryAuth ? {} : { Authorization: `Bearer ${accessToken}` }),
    "Content-Type": "application/json",
    ...fixedHeaders,
    ...fetchInit.headers,
  };
  const path = isQueryAuth
    ? `${rawPath}${rawPath.includes("?") ? "&" : "?"}${config.auth!.param}=${encodeURIComponent(accessToken)}`
    : rawPath;

  const method = (fetchInit.method ?? "GET").toUpperCase();
  const timeout = fetchInit.timeout ?? config.timeoutMs;
  const retryConfig = config.retry;
  const retryApplies =
    retryConfig !== undefined &&
    retryOverride !== false &&
    (retryOverride === true ||
      !retryConfig.methods ||
      retryConfig.methods.includes(method));

  const fetchOnce = () =>
    tracer.startActiveSpan(
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
          const res = await safeFetch(`${baseUrl}${path}`, {
            ...fetchInit,
            timeout,
            headers,
          });
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

  if (!retryApplies) {
    onAttempt?.(1);
    return fetchOnce();
  }

  const retryStatuses = retryConfig.statusCodes;
  return retryOperation(fetchOnce, {
    delaysMs: retryConfig.delaysMs,
    onAttempt,
    shouldRetryResult: (res) =>
      retryStatuses ? retryStatuses.includes(res.status) : res.status >= 500,
    shouldRetryError: retryConfig.retryNetworkErrors
      ? isRetriableNetworkError
      : () => false,
    getDelayMs: retryConfig.respectRetryAfterHeader
      ? ({ result, fallbackDelayMs }) =>
          retryAfterDelayMs(result?.headers.get("Retry-After") ?? null, fallbackDelayMs)
      : undefined,
  });
}

/**
 * Thin envelope over serviceFetch for the common REST-JSON pattern shared by
 * most providers: throw on non-2xx, treat 204 as a bodyless success, else
 * parse JSON. `label` is used in the log line and thrown error message.
 */
export async function serviceJsonFetch(
  connectionId: string,
  path: string,
  label: string,
  init?: ServiceFetchOptions,
  opts?: { responseType?: "text" }
): Promise<unknown> {
  const res = await serviceFetch(connectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] ${label} API error (${res.status})`);
    throw new Error(`${label} API request failed`);
  }

  if (res.status === 204) return { success: true };
  if (opts?.responseType === "text") return { content: await res.text() };
  return res.json();
}
