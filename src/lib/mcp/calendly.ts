import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const CALENDLY_API_BASE = "https://api.calendly.com";

export async function calendlyFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const apiKey = decrypt(connection.accessToken);

  const res = await fetch(`${CALENDLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Calendly API error (${res.status}):`, text);
    throw new Error(`Calendly API request failed (${res.status}): ${text}`);
  }

  return res.json();
}
