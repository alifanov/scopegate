import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function hubspotFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] HubSpot API error (${res.status})`);
    throw new Error("HubSpot API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
