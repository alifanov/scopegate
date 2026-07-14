import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function googleTagManagerFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return serviceJsonFetch(serviceConnectionId, path, "Google Tag Manager", init);
}
