import { serviceFetch } from "@/lib/mcp/service-fetch";

export async function ahrefsFetch(
  serviceConnectionId: string,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await serviceFetch(serviceConnectionId, `${path}${query}`);

  if (!res.ok) {
    console.error(`[ScopeGate] Ahrefs API error (${res.status})`);
    throw new Error("Ahrefs API request failed");
  }

  return res.json();
}
