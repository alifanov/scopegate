import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function jiraFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Jira API error (${res.status})`);
    throw new Error("Jira API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
