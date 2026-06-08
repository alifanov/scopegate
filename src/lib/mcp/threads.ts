import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, {
    timeout: 8_000,
    ...init,
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Threads API error (${res.status})`);
    throw new Error("Threads API request failed");
  }

  return res.json();
}
