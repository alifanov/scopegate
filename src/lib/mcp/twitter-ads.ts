import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

const TWITTER_ADS_BASE_URL = "https://ads-api.x.com/12";

interface TwitterOAuthCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
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
      return crypto
        .createHmac("sha1", key)
        .update(baseString)
        .digest("base64");
    },
  });

  const authorization = oauth.authorize(
    { url, method },
    { key: credentials.accessToken, secret: credentials.accessTokenSecret }
  );

  return oauth.toHeader(authorization).Authorization;
}

export async function twitterAdsFetch(
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

  const fullUrl = `${TWITTER_ADS_BASE_URL}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();

  const parsedUrl = new URL(fullUrl);
  const baseUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;

  const authHeader = createOAuthHeader(credentials, baseUrl, method);

  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      `[ScopeGate] Twitter Ads API error (${res.status}):`,
      text
    );
    throw new Error(
      `Twitter Ads API request failed (${res.status}): ${text}`
    );
  }

  return res.json();
}
