import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export async function openRouterFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const apiKey = decrypt(connection.accessToken);

  const res = await fetch(`${OPENROUTER_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] OpenRouter API error (${res.status}):`, text);
    throw new Error("OpenRouter API request failed");
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
