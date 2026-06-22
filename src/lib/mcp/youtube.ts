import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";
import { safeFetch } from "./safe-fetch";
import { readBodyWithLimit } from "./media-body";

const MAX_VIDEO_BYTES = 256 * 1024 * 1024; // 256 MB in-memory limit

const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

export async function youtubeFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions,
  options?: { responseType?: "text" }
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] YouTube API error (${res.status})`);
    throw new Error("YouTube API request failed");
  }

  if (res.status === 204) return { success: true };

  if (options?.responseType === "text") {
    return { content: await res.text() };
  }

  return res.json();
}

export async function youtubeUploadVideo(
  serviceConnectionId: string,
  videoUrl: string,
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: "public" | "private" | "unlisted";
  }
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  // Download video from URL — safeFetch blocks SSRF: only https:, no private/reserved IPs
  const videoRes = await safeFetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download video from URL (${videoRes.status}): ${videoRes.statusText}`);
  }

  const contentType = videoRes.headers.get("content-type") || "video/mp4";
  const videoBuffer = await readBodyWithLimit(videoRes, MAX_VIDEO_BYTES, "Video");

  // Build metadata body
  const body: Record<string, unknown> = {
    snippet: {
      title: metadata.title,
      description: metadata.description || "",
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || "22",
    },
    status: {
      privacyStatus: metadata.privacyStatus || "private",
    },
  };

  // Step 1: Initiate resumable upload
  const initRes = await safeFetch(
    `${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoBuffer.length),
        "X-Upload-Content-Type": contentType,
      },
      body: JSON.stringify(body),
    }
  );

  if (!initRes.ok) {
    console.error(`[ScopeGate] YouTube upload init error (${initRes.status})`);
    throw new Error("YouTube upload init failed");
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube upload init did not return upload URL");
  }

  // Step 2: Upload the video bytes to the provider-returned URL (SSRF-safe)
  const uploadRes = await safeFetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(videoBuffer.length),
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    console.error(`[ScopeGate] YouTube upload error (${uploadRes.status})`);
    throw new Error("YouTube video upload failed");
  }

  return uploadRes.json();
}
