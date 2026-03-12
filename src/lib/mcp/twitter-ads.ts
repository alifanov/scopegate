import { getValidTwitterAccessToken } from "@/lib/twitter-oauth";

const TWITTER_ADS_BASE_URL = "https://ads-api.x.com/12";

export async function twitterAdsFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidTwitterAccessToken(serviceConnectionId);

  const fullUrl = `${TWITTER_ADS_BASE_URL}${path}`;

  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      `[ScopeGate] Twitter Ads API error (${res.status}):`,
      text
    );
    throw new Error(
      `Twitter Ads API request failed (${res.status}): ${text}`
    );
  }

  return res.json();
}
