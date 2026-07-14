import { getValidAccessToken, OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { getProviderDef } from "@/lib/provider-registry";

const TWITTER_UPLOAD_URL = "https://api.x.com/2/media/upload";
// HTTP statuses that mean the access token itself is invalid/revoked (defined
// in PROVIDER_REGISTRY so the "what counts as a dead token" fact lives in one place).
const TWITTER_TOKEN_ERROR_CODES = getProviderDef("twitter")?.oauthErrors?.permanentCodes ?? [];

// Twitter API v2 error bodies vary: { title, detail, status } or { errors: [{ message | detail }] }.
// Surface the real reason so failures are diagnosable instead of an opaque "request failed".
function extractTwitterError(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as {
    detail?: string;
    title?: string;
    errors?: Array<{ message?: string; detail?: string }>;
  };
  if (Array.isArray(b.errors) && b.errors.length) {
    const msgs = b.errors.map((e) => e?.detail ?? e?.message).filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  return b.detail ?? b.title;
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

export async function twitterFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    const detail = extractTwitterError(await res.json().catch(() => undefined));
    const message = detail
      ? `Twitter API error (${res.status}): ${detail}`
      : `Twitter API error (${res.status})`;
    // 401 = invalid/expired token → trigger reconnect flow. 403 is left as a generic
    // error on purpose (duplicate tweet, missing scope, suspension) to avoid false revokes.
    if (TWITTER_TOKEN_ERROR_CODES.includes(res.status)) {
      throw new OAuthTokenError(message, { provider: "twitter", code: res.status });
    }
    throw new Error(message);
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
    const detail = extractTwitterError(await res.json().catch(() => undefined));
    const message = detail
      ? `Twitter media upload failed (${res.status}): ${detail}`
      : `Twitter media upload failed (${res.status})`;
    if (TWITTER_TOKEN_ERROR_CODES.includes(res.status)) {
      throw new OAuthTokenError(message, { provider: "twitter", code: res.status });
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { data?: { id?: string } };
  const mediaId = data?.data?.id;
  if (!mediaId) {
    throw new Error("Twitter media upload did not return media id");
  }

  return mediaId;
}
