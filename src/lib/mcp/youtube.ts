import { getValidAccessToken } from "@/lib/google-oauth";

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

export async function youtubeFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${YOUTUBE_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] YouTube API error (${res.status}):`, text);
    throw new Error(`YouTube API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
