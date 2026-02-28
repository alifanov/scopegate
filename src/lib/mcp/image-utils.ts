const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface DownloadedImage {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

export async function downloadImage(urlOrBase64: string): Promise<DownloadedImage> {
  // Handle data URI (base64)
  if (urlOrBase64.startsWith("data:")) {
    const match = urlOrBase64.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) {
      throw new Error("Invalid data URI format. Expected: data:<mime>;base64,<data>");
    }
    const [, mimeType, base64Data] = match;
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Unsupported image type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(
        `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 5MB`
      );
    }
    return { buffer, mimeType, sizeBytes: buffer.length };
  }

  // Handle URL
  const res = await fetch(urlOrBase64);
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

  return { buffer, mimeType: contentType, sizeBytes: buffer.length };
}
