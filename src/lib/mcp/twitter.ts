import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const TWITTER_BASE_URL = "https://api.x.com/2";

export interface TwitterOAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

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

function createOAuthHeader(
  credentials: TwitterOAuthCredentials,
  url: string,
  method: string
): string {
  const oauth = new OAuth({
    consumer: { key: credentials.apiKey, secret: credentials.apiSecret },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const authorization = oauth.authorize(
    { url, method },
    { key: credentials.accessToken, secret: credentials.accessTokenSecret }
  );

  return oauth.toHeader(authorization).Authorization;
}

export async function twitterFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });

  const credentials: TwitterOAuthCredentials = JSON.parse(
    decrypt(connection.accessToken)
  );

  const url = `${TWITTER_BASE_URL}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const authHeader = createOAuthHeader(credentials, url, method);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: authHeader,
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
