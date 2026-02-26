const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface DownloadedImage {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

export async function downloadImage(url: string): Promise<DownloadedImage> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status}): ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `Unsupported image type: ${contentType ?? "unknown"}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(
      `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 5MB`
    );
  }

  return {
    buffer,
    mimeType: contentType,
    sizeBytes: buffer.length,
  };
}
