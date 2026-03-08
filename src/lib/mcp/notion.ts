import { getValidNotionAccessToken } from "@/lib/notion-oauth";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export async function notionFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidNotionAccessToken(serviceConnectionId);

  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Notion API error (${res.status}):`, text);
    throw new Error(`Notion API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
