import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const SEMRUSH_API_BASE = "https://api.semrush.com";

export async function semrushFetch(
  serviceConnectionId: string,
  params: Record<string, string>
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const apiKey = decrypt(connection.accessToken);

  const query = new URLSearchParams({ ...params, key: apiKey });
  const res = await fetch(`${SEMRUSH_API_BASE}/?${query.toString()}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] SEMrush API error (${res.status}):`, text);
    throw new Error(`SEMrush API request failed (${res.status}): ${text}`);
  }

  const text = await res.text();
  if (text.startsWith("ERROR"))
    throw new Error(`SEMrush API error: ${text}`);

  // Parse CSV response into objects
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { data: [], raw: text };
  const headers = lines[0].split(";");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(";");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || "";
    });
    return obj;
  });
  return { data: rows };
}
