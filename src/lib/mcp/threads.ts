import { getValidThreadsAccessToken } from "@/lib/threads-oauth";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidThreadsAccessToken(serviceConnectionId);

  const separator = path.includes("?") ? "&" : "?";
  const url = `${THREADS_API_BASE}${path}${separator}access_token=${accessToken}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Threads API error (${res.status}):`, text);
    throw new Error(`Threads API request failed (${res.status}): ${text}`);
  }

  return res.json();
}
