import { randomUUID } from "node:crypto";
import { getValidAccessToken, OAuthTokenError } from "@/lib/oauth-token-lifecycle";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { safeFetch } from "@/lib/mcp/safe-fetch";
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

// safeFetch only accepts string/Buffer bodies (no FormData) — build the
// multipart/form-data body by hand so the upload still goes through the
// SSRF-safe transport instead of a bare fetch().
function buildMultipartBody(
  boundary: string,
  fields: Array<{ name: string; value: string | Buffer; filename?: string; contentType?: string }>
): Buffer {
  const parts: Buffer[] = [];
  for (const field of fields) {
    let header = `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"`;
    if (field.filename) header += `; filename="${field.filename}"`;
    header += "\r\n";
    if (field.contentType) header += `Content-Type: ${field.contentType}\r\n`;
    header += "\r\n";
    parts.push(Buffer.from(header, "utf-8"));
    parts.push(typeof field.value === "string" ? Buffer.from(field.value, "utf-8") : field.value);
    parts.push(Buffer.from("\r\n", "utf-8"));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`, "utf-8"));
  return Buffer.concat(parts);
}

export async function twitterUploadMedia(
  serviceConnectionId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const accessToken = await getValidAccessToken(serviceConnectionId);
  const boundary = `----ScopeGateBoundary${randomUUID()}`;
  const category = mimeType.startsWith("image/gif") ? "tweet_gif" : "tweet_image";
  const body = buildMultipartBody(boundary, [
    { name: "media", value: imageBuffer, filename: "media", contentType: mimeType },
    { name: "media_category", value: category },
  ]);

  const res = await safeFetch(TWITTER_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: new Uint8Array(body),
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
