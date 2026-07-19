import { serviceJsonFetch } from "@/lib/mcp/service-fetch";

export function ahrefsFetch(
  serviceConnectionId: string,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return serviceJsonFetch(serviceConnectionId, `${path}${query}`);
}
