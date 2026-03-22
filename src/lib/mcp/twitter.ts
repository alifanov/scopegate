import { getValidTwitterAccessToken } from "@/lib/twitter-oauth";

const TWITTER_BASE_URL = "https://api.x.com/2";
const TWITTER_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

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
  const accessToken = await getValidTwitterAccessToken(serviceConnectionId);

  const fullUrl = `${TWITTER_BASE_URL}${path}`;

  const res = await fetch(fullUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Twitter API error (${res.status}):`, text);
    throw new Error(`Twitter API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}

export async function twitterUploadMedia(
  serviceConnectionId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const accessToken = await getValidTwitterAccessToken(serviceConnectionId);

  const body = new URLSearchParams();
  body.append("media_data", imageBuffer.toString("base64"));

  const res = await fetch(TWITTER_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] Twitter media upload error (${res.status}):`, text);
    throw new Error(`Twitter media upload failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { media_id_string?: string };
  if (!data.media_id_string) {
    throw new Error("Twitter media upload did not return media_id_string");
  }

  return data.media_id_string;
}
