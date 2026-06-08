import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function googleCalendarFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Google Calendar API error (${res.status})`);
    throw new Error("Google Calendar API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
