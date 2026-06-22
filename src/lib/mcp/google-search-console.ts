import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { safeFetch, type SafeFetchOptions } from "@/lib/mcp/safe-fetch";
import { retry, retryAfterDelayMs } from "@/lib/mcp/retry";
import { metrics, type Histogram } from "@opentelemetry/api";

const WEBMASTERS_BASE_URL = "https://www.googleapis.com/webmasters/v3";
const SEARCH_CONSOLE_V1_BASE_URL = "https://searchconsole.googleapis.com/v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — URL inspection results change at most hourly
const URL_INSPECTION_TIMEOUT_MS = 5_000;

// POST paths that are read-only and safe to cache
const CACHEABLE_POST_PATHS = ["/searchAnalytics/query", "/urlInspection/index:inspect"];

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}
const responseCache = new Map<string, CacheEntry>();

let gscLatency: Histogram | null = null;
function recordLatency(ms: number) {
  if (!gscLatency) {
    gscLatency = metrics.getMeter("scopegate").createHistogram("mcp.google_sc.latency_ms", {
      description: "Latency of outbound Google Search Console API calls",
      unit: "ms",
    });
  }
  gscLatency.record(ms);
}

function cacheKey(serviceConnectionId: string, url: string, body?: string): string {
  return `${serviceConnectionId}:${url}:${body ?? ""}`;
}

function isCacheable(method: string | undefined, path: string): boolean {
  const m = (method ?? "GET").toUpperCase();
  if (m === "GET") return true;
  if (m === "POST") return CACHEABLE_POST_PATHS.some((p) => path.includes(p));
  return false;
}

async function fetchWithRetry(url: string, init: SafeFetchOptions): Promise<Response> {
  return retry(() => safeFetch(url, init), {
    delaysMs: [1_000, 2_000, 4_000],
    shouldRetryResult: (res) => res.status === 429,
    shouldRetryError: () => false,
    getDelayMs: ({ result, fallbackDelayMs }) =>
      retryAfterDelayMs(result?.headers.get("Retry-After") ?? null, fallbackDelayMs),
  });
}

async function gscFetch(
  serviceConnectionId: string,
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const method = init?.method;
  const body = typeof init?.body === "string" ? init.body : undefined;
  const fullUrl = `${baseUrl}${path}`;
  const cacheable = isCacheable(method, path);
  const key = cacheKey(serviceConnectionId, fullUrl, body);

  if (cacheable) {
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const accessToken = await getValidAccessToken(serviceConnectionId);
  const start = Date.now();

  const isUrlInspection = path.includes("/urlInspection/");

  const res = await fetchWithRetry(fullUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    ...(isUrlInspection ? { timeout: URL_INSPECTION_TIMEOUT_MS } : {}),
  });

  recordLatency(Date.now() - start);

  if (!res.ok) {
    console.error(
      `[ScopeGate] Google Search Console API error (${res.status}): ${baseUrl}${path}`
    );
    throw new Error("Google Search Console API request failed");
  }

  if (res.status === 204) {
    return { success: true };
  }

  const data = await res.json() as unknown;

  if (cacheable) {
    responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return data;
}

export async function googleSearchConsoleFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  return gscFetch(serviceConnectionId, WEBMASTERS_BASE_URL, path, init);
}

export async function googleSearchConsoleV1Fetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  return gscFetch(serviceConnectionId, SEARCH_CONSOLE_V1_BASE_URL, path, init);
}
