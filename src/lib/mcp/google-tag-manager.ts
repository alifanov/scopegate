import { getValidAccessToken } from "@/lib/google-oauth";

const GTM_BASE_URL = "https://tagmanager.googleapis.com/tagmanager/v2";

export async function googleTagManagerFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${GTM_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Tag Manager API error (${res.status}):`, text);
    throw new Error(`Google Tag Manager API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
