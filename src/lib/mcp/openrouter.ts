import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

const CREDITS_CACHE_TTL_MS = 3_600_000; // 1 hour

const creditsCache = new Map<
  string,
  { value: unknown; expiresAt: number }
>();

export async function openRouterFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] OpenRouter API error (${res.status})`);
    throw new Error("OpenRouter API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

export async function getOpenRouterCredits(
  serviceConnectionId: string
): Promise<unknown> {
  const cached = creditsCache.get(serviceConnectionId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  try {
    const value = await openRouterFetch(serviceConnectionId, "/credits");
    creditsCache.set(serviceConnectionId, {
      value,
      expiresAt: Date.now() + CREDITS_CACHE_TTL_MS,
    });
    return value;
  } catch (err) {
    // Graceful degradation: return stale cached value if available
    if (cached) {
      return cached.value;
    }
    throw err;
  }
}
