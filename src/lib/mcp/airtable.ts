import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export async function airtableFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const apiKey = decrypt(connection.accessToken);

  const res = await fetch(`${AIRTABLE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Airtable API error (${res.status}):`, text);
    throw new Error(`Airtable API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) return { success: true };
  return res.json();
}
