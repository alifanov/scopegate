import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function notionFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Notion API error (${res.status})`);
    throw new Error("Notion API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
