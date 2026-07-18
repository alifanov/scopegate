import { safeFetch } from "./safe-fetch";
import { readBodyWithLimit } from "./media-body";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface DownloadedImage {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED_DOC_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];
const MAX_DOC_SIZE_BYTES = 100 * 1024 * 1024; // 100MB — LinkedIn documents limit

// Download a document (PDF/DOC/PPT) from a URL or base64 data URI, for LinkedIn document posts.
// ponytail: mirrors downloadImage; separate allow-list + size cap for documents.
export async function downloadDocument(urlOrBase64: string): Promise<DownloadedImage> {
  if (urlOrBase64.startsWith("data:")) {
    const match = urlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URI format. Expected: data:<mime>;base64,<data>");
    }
    const [, mimeType, base64Data] = match;
    if (!ALLOWED_DOC_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `Unsupported document type: ${mimeType}. Allowed: ${ALLOWED_DOC_MIME_TYPES.join(", ")}`
      );
    }
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > MAX_DOC_SIZE_BYTES) {
      throw new Error(
        `Document too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 100MB`
      );
    }
    return { buffer, mimeType, sizeBytes: buffer.length };
  }

  const res = await safeFetch(urlOrBase64);
  if (!res.ok) {
    throw new Error(`Failed to download document (${res.status}): ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !ALLOWED_DOC_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `Unsupported document type: ${contentType ?? "unknown"}. Allowed: ${ALLOWED_DOC_MIME_TYPES.join(", ")}`
    );
  }

  const buffer = await readBodyWithLimit(res, MAX_DOC_SIZE_BYTES, "Document");

  return { buffer, mimeType: contentType, sizeBytes: buffer.length };
}

export async function downloadImage(urlOrBase64: string): Promise<DownloadedImage> {
  // Handle data URI (base64)
  if (urlOrBase64.startsWith("data:")) {
    const match = urlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
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

  // Handle URL — safeFetch blocks SSRF: only https:, no private/reserved IPs
  const res = await safeFetch(urlOrBase64);
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status}): ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(
      `Unsupported image type: ${contentType ?? "unknown"}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  const buffer = await readBodyWithLimit(res, MAX_SIZE_BYTES, "Image");

  return { buffer, mimeType: contentType, sizeBytes: buffer.length };
}
