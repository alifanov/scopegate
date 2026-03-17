import { getValidAccessToken } from "@/lib/google-oauth";

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

export async function youtubeFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit,
  options?: { responseType?: "text" }
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${YOUTUBE_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ScopeGate] YouTube API error (${res.status}):`, text);
    throw new Error(`YouTube API request failed (${res.status}): ${text}`);
  }

  if (res.status === 204) {
    return { success: true };
  }

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

  // Download video from URL
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download video from URL (${videoRes.status}): ${videoRes.statusText}`);
  }

  const contentType = videoRes.headers.get("content-type") || "video/mp4";
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

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
  const initRes = await fetch(
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
    const text = await initRes.text();
    console.error(`[ScopeGate] YouTube upload init error (${initRes.status}):`, text);
    throw new Error(`YouTube upload init failed (${initRes.status}): ${text}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube upload init did not return upload URL");
  }

  // Step 2: Upload the video bytes
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(videoBuffer.length),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error(`[ScopeGate] YouTube upload error (${uploadRes.status}):`, text);
    throw new Error(`YouTube video upload failed (${uploadRes.status}): ${text}`);
  }

  return uploadRes.json();
}
