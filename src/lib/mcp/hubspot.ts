import { getValidHubSpotAccessToken } from "@/lib/hubspot-oauth";

const HUBSPOT_API_BASE = "https://api.hubapi.com";

export async function hubspotFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidHubSpotAccessToken(serviceConnectionId);

  const res = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    console.error(`[ScopeGate] HubSpot API error (${res.status})`);
    throw new Error("HubSpot API request failed");
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
