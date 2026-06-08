import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";

const SEMRUSH_API_BASE = "https://api.semrush.com";

export async function semrushFetch(
  serviceConnectionId: string,
  params: Record<string, string>
): Promise<unknown> {
  // SEMrush uses API key as a query parameter
  const apiKey = await getValidAccessToken(serviceConnectionId);
  const query = new URLSearchParams({ ...params, key: apiKey });
  const res = await safeFetch(`${SEMRUSH_API_BASE}/?${query.toString()}`);

  if (!res.ok) {
    console.error(`[ScopeGate] SEMrush API error (${res.status})`);
    throw new Error("SEMrush API request failed");
  }

  const text = await res.text();
  if (text.startsWith("ERROR")) throw new Error("SEMrush API error");

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
