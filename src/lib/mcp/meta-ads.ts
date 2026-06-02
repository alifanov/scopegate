import { getValidMetaAccessToken } from "@/lib/meta-oauth";

const META_API_BASE = "https://graph.facebook.com/v21.0";

export async function metaAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidMetaAccessToken(serviceConnectionId);

  const separator = path.includes("?") ? "&" : "?";
  const url = `${META_API_BASE}${path}${separator}access_token=${accessToken}`;

  const res = await fetch(url, {
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
