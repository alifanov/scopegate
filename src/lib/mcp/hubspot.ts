import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function hubspotFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return serviceJsonFetch(serviceConnectionId, path, "HubSpot", init);
}
