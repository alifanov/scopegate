import { getValidAccessToken } from "@/lib/google-oauth";

const WEBMASTERS_BASE_URL = "https://www.googleapis.com/webmasters/v3";
const SEARCH_CONSOLE_V1_BASE_URL = "https://searchconsole.googleapis.com/v1";

export async function googleSearchConsoleFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${WEBMASTERS_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Search Console API error (${res.status}):`, text);
    throw new Error("Google Search Console API request failed");
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}

export async function googleSearchConsoleV1Fetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${SEARCH_CONSOLE_V1_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Google Search Console v1 API error (${res.status}):`, text);
    throw new Error("Google Search Console API request failed");
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
