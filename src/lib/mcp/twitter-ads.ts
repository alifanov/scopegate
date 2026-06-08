import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function twitterAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Twitter Ads API error (${res.status})`);
    throw new Error("Twitter Ads API request failed");
  }

  return res.json();
}
