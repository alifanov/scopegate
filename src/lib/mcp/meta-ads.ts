import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";

const META_API_BASE = "https://graph.facebook.com/v21.0";

export async function metaAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: { method?: string; body?: string; headers?: Record<string, string> }
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  // Meta uses token as a query parameter instead of an Authorization header
  const separator = path.includes("?") ? "&" : "?";
  const url = `${META_API_BASE}${path}${separator}access_token=${accessToken}`;

  const res = await safeFetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Meta Ads API error (${res.status})`);
    throw new Error("Meta Ads API request failed");
  }

  return res.json();
}
