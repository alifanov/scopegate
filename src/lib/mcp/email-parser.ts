/**
 * Simple email source parser to extract text and HTML parts
 * from raw MIME email source without heavy dependencies.
 */
export function simpleParseEmail(source: string): {
  text: string;
  html: string;
} {
  let text = "";
  let html = "";

  // Check if it's a multipart message
  const contentTypeMatch = source.match(
    /Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^\s"]+)"?/i
  );

  if (contentTypeMatch) {
    const boundary = contentTypeMatch[1];
    const parts = source.split(`--${boundary}`);

    for (const part of parts) {
      if (part.trim() === "--" || part.trim() === "") continue;

      const partContentType =
        part.match(/Content-Type:\s*([^\s;]+)/i)?.[1] || "";
      const transferEncoding =
        part.match(/Content-Transfer-Encoding:\s*(\S+)/i)?.[1] || "";

      // Split headers from body (double newline)
      const bodyStart =
        part.indexOf("\r\n\r\n") !== -1
          ? part.indexOf("\r\n\r\n") + 4
          : part.indexOf("\n\n") + 2;
      if (bodyStart < 2) continue;
      let body = part.slice(bodyStart).trim();

      // Decode transfer encoding
      if (transferEncoding.toLowerCase() === "base64") {
        try {
          body = Buffer.from(body.replace(/\s/g, ""), "base64").toString(
            "utf-8"
          );
        } catch {
          // Keep as-is if decode fails
        }
      } else if (transferEncoding.toLowerCase() === "quoted-printable") {
        body = decodeQuotedPrintable(body);
      }

      if (partContentType.toLowerCase() === "text/plain" && !text) {
        text = body;
      } else if (partContentType.toLowerCase() === "text/html" && !html) {
        html = body;
      }
    }
  } else {
    // Single-part message
    const contentType =
      source.match(/Content-Type:\s*([^\s;]+)/i)?.[1] || "text/plain";
    const transferEncoding =
      source.match(/Content-Transfer-Encoding:\s*(\S+)/i)?.[1] || "";

    const bodyStart =
      source.indexOf("\r\n\r\n") !== -1
        ? source.indexOf("\r\n\r\n") + 4
        : source.indexOf("\n\n") + 2;
    let body = bodyStart >= 2 ? source.slice(bodyStart).trim() : source;

    if (transferEncoding.toLowerCase() === "base64") {
      try {
        body = Buffer.from(body.replace(/\s/g, ""), "base64").toString(
          "utf-8"
        );
      } catch {
        // Keep as-is
      }
    } else if (transferEncoding.toLowerCase() === "quoted-printable") {
      body = decodeQuotedPrintable(body);
    }

    if (contentType.toLowerCase() === "text/html") {
      html = body;
    } else {
      text = body;
    }
  }

  // If we only have HTML, strip tags to create text version
  if (!text && html) {
    text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return { text, html };
}

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, "") // Soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}
