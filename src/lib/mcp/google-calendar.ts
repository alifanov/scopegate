import { serviceJsonFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export function googleCalendarFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  return serviceJsonFetch(serviceConnectionId, path, "Google Calendar", init);
}
