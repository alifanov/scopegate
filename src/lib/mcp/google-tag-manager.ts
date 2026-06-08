import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function googleTagManagerFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Google Tag Manager API error (${res.status})`);
    throw new Error("Google Tag Manager API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
