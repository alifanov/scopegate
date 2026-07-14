import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { metrics, type Histogram } from "@opentelemetry/api";

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

async function gscFetch(
  serviceConnectionId: string,
  baseUrlKey: "default" | "v1",
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const method = init?.method;
  const body = typeof init?.body === "string" ? init.body : undefined;
  const cacheable = isCacheable(method, path);
  const key = cacheKey(serviceConnectionId, `${baseUrlKey}:${path}`, body);

  if (cacheable) {
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const isUrlInspection = path.includes("/urlInspection/");
  const start = Date.now();

  const res = await serviceFetch(serviceConnectionId, path, {
    ...init,
    ...(baseUrlKey === "v1" ? { baseUrlKey: "v1" } : {}),
    timeout: isUrlInspection ? URL_INSPECTION_TIMEOUT_MS : init?.timeout,
  });

  recordLatency(Date.now() - start);

  if (!res.ok) {
    console.error(
      `[ScopeGate] Google Search Console API error (${res.status}): ${baseUrlKey}${path}`
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
  init?: ServiceFetchOptions
): Promise<unknown> {
  return gscFetch(serviceConnectionId, "default", path, init);
}

export async function googleSearchConsoleV1Fetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return gscFetch(serviceConnectionId, "v1", path, init);
}
