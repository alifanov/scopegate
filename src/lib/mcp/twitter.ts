import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

const TWITTER_BASE_URL = "https://api.x.com/2";

// Cache authenticated user IDs per service connection
const userIdCache = new Map<string, string>();

export async function getAuthenticatedUserId(
  serviceConnectionId: string
): Promise<string> {
  const cached = userIdCache.get(serviceConnectionId);
  if (cached) return cached;

  const data = (await twitterFetch(serviceConnectionId, "/users/me")) as {
    data?: { id?: string };
  };
  const userId = data?.data?.id;
  if (!userId) throw new Error("Failed to resolve authenticated Twitter user");

  userIdCache.set(serviceConnectionId, userId);
  return userId;
}

export async function twitterFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const token = decrypt(connection.accessToken);

  const res = await fetch(`${TWITTER_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Twitter API error (${res.status}):`, text);
    throw new Error("Twitter API request failed");
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
