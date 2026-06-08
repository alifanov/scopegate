import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

const TWITTER_UPLOAD_URL = "https://api.x.com/2/media/upload";

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
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Twitter API error (${res.status})`);
    throw new Error("Twitter API request failed");
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
  // FormData body is not supported by safeFetch — use bare fetch for this fixed-URL upload
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const formData = new FormData();
  formData.append("media", new Blob([imageBuffer.buffer as ArrayBuffer], { type: mimeType }));
  formData.append("media_category", mimeType.startsWith("image/gif") ? "tweet_gif" : "tweet_image");

  const res = await fetch(TWITTER_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    console.error(`[ScopeGate] Twitter media upload error (${res.status})`);
    throw new Error("Twitter media upload failed");
  }

  const data = (await res.json()) as { data?: { id?: string } };
  const mediaId = data?.data?.id;
  if (!mediaId) {
    throw new Error("Twitter media upload did not return media id");
  }

  return mediaId;
}
