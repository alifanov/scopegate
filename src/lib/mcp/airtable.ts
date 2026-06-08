import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function airtableFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Airtable API error (${res.status})`);
    throw new Error("Airtable API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
