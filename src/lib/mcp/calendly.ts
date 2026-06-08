import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function calendlyFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Calendly API error (${res.status})`);
    throw new Error("Calendly API request failed");
  }

  return res.json();
}
