import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const AHREFS_API_BASE = "https://api.ahrefs.com/v3";

export async function ahrefsFetch(
  serviceConnectionId: string,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const apiKey = decrypt(connection.accessToken);

  const query = params
    ? `?${new URLSearchParams(params).toString()}`
    : "";
  const res = await fetch(`${AHREFS_API_BASE}${path}${query}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Ahrefs API error (${res.status}):`, text);
    throw new Error(`Ahrefs API request failed (${res.status}): ${text}`);
  }

  return res.json();
}
