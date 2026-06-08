import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function githubFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] GitHub API error (${res.status})`);
    throw new Error("GitHub API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
