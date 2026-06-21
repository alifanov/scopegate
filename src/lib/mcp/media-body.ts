export async function readBodyWithLimit(
  res: Response,
  maxBytes: number,
  label: string
): Promise<Buffer> {
  const contentLengthHeader = res.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(
        `${label} too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB. Max: ${(maxBytes / 1024 / 1024).toFixed(1)}MB`
      );
    }
  }

  if (!res.body) {
    return Buffer.alloc(0);
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(
          `${label} too large: ${(totalBytes / 1024 / 1024).toFixed(1)}MB. Max: ${(maxBytes / 1024 / 1024).toFixed(1)}MB`
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}
