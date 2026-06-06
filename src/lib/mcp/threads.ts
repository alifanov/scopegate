import { getValidThreadsAccessToken } from "@/lib/threads-oauth";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

export async function threadsFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidThreadsAccessToken(serviceConnectionId);

  const url = `${THREADS_API_BASE}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Threads API error (${res.status})`);
    throw new Error("Threads API request failed");
  }

  return res.json();
}
