import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function twitterAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return serviceJsonFetch(serviceConnectionId, path, "Twitter Ads", init);
}
