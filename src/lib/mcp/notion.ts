import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function notionFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return serviceJsonFetch(serviceConnectionId, path, "Notion", init);
}
