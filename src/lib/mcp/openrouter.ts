import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

const CREDITS_CACHE_TTL_MS = 5 * 60 * 1000;

const creditsCache = new Map<
  string,
  { value: unknown; expiresAt: number }
>();
const creditsRefreshes = new Map<string, Promise<unknown>>();

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

  if (cached) {
    void refreshOpenRouterCredits(serviceConnectionId).catch(() => undefined);
    return cached.value;
  }

  return refreshOpenRouterCredits(serviceConnectionId);
}

async function refreshOpenRouterCredits(
  serviceConnectionId: string
): Promise<unknown> {
  const pending = creditsRefreshes.get(serviceConnectionId);
  if (pending) return pending;

  const refresh = openRouterFetch(serviceConnectionId, "/credits")
    .then((value) => {
      creditsCache.set(serviceConnectionId, {
        value,
        expiresAt: Date.now() + CREDITS_CACHE_TTL_MS,
      });
      return value;
    })
    .finally(() => {
      creditsRefreshes.delete(serviceConnectionId);
    });

  creditsRefreshes.set(serviceConnectionId, refresh);
  return refresh;
}
