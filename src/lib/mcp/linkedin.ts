import { getValidLinkedInAccessToken } from "@/lib/linkedin-oauth";

const LINKEDIN_REST_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_V2_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_VERSION = "202601";

// Cache member URN per service connection
const memberUrnCache = new Map<string, string>();

export async function getLinkedInMemberUrn(
  serviceConnectionId: string
): Promise<string> {
  const cached = memberUrnCache.get(serviceConnectionId);
  if (cached) return cached;

  const accessToken = await getValidLinkedInAccessToken(serviceConnectionId);
  const res = await fetch(`${LINKEDIN_V2_BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch LinkedIn member URN (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { sub: string };
  const urn = `urn:li:person:${data.sub}`;
  memberUrnCache.set(serviceConnectionId, urn);
  return urn;
}

export async function linkedinFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit & { useV2?: boolean }
): Promise<unknown> {
  const accessToken = await getValidLinkedInAccessToken(serviceConnectionId);
  const base = init?.useV2 ? LINKEDIN_V2_BASE : LINKEDIN_REST_BASE;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": LINKEDIN_VERSION,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] LinkedIn API error (${res.status}):`, text);
    throw new Error(`LinkedIn API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204 || res.status === 201) {
    const id = res.headers.get("x-restli-id");
    return { success: true, ...(id ? { id } : {}) };
  }

  const text = await res.text();
  if (!text) {
    return { success: true };
  }

  return JSON.parse(text);
}
