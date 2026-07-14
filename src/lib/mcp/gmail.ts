import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function gmailFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const reason =
      (() => {
        try {
          return (JSON.parse(body) as { error?: { message?: string } }).error?.message;
        } catch {
          return undefined;
        }
      })() ?? body.slice(0, 200);
    console.error(`[ScopeGate] Gmail API error (${res.status}): ${reason}`);
    throw new Error(`Gmail API request failed (${res.status}): ${reason}`);
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

type GmailMessageMeta = {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
};

function header(msg: GmailMessageMeta, name: string): string | undefined {
  return msg.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

// List message ids (optionally filtered by `q`), then fetch metadata headers for each.
export async function listGmailMessages(
  connectionId: string,
  maxResults: number,
  query?: string
): Promise<unknown> {
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (query) params.set("q", query);

  const list = (await gmailFetch(
    connectionId,
    `/users/me/messages?${params.toString()}`
  )) as { messages?: { id: string }[] };

  const ids = list.messages ?? [];
  const messages = await Promise.all(
    ids.map(async ({ id }) => {
      const msg = (await gmailFetch(
        connectionId,
        `/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
      )) as GmailMessageMeta;
      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet,
        from: header(msg, "From"),
        subject: header(msg, "Subject"),
        date: header(msg, "Date"),
      };
    })
  );

  return { messages };
}

type GmailPart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: GmailPart[];
};

// Walk the MIME tree and return the first inline body of `mimeType` (decoded).
function findBody(part: GmailPart | undefined, mimeType: string): string {
  if (!part) return "";
  // Skip attachments (they have a filename); we only want inline text bodies.
  if (!part.filename && part.mimeType === mimeType && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }
  for (const child of part.parts ?? []) {
    const found = findBody(child, mimeType);
    if (found) return found;
  }
  return "";
}

function stripHtml(html: string): string {
  return html
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

// Read one message's body. `format="text"` returns plain text only (text/plain,
// falling back to tag-stripped HTML); `format="full"` adds headers + raw HTML.
export async function getGmailMessage(
  connectionId: string,
  messageId: string,
  format: "full" | "text" = "full"
): Promise<unknown> {
  const msg = (await gmailFetch(
    connectionId,
    `/users/me/messages/${messageId}?format=full`
  )) as GmailMessageMeta & { payload?: GmailPart };

  const html = findBody(msg.payload, "text/html");
  const plain = findBody(msg.payload, "text/plain");
  const text = plain || (html ? stripHtml(html) : msg.snippet ?? "");

  if (format === "text") {
    return { id: msg.id, threadId: msg.threadId, text };
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet,
    from: header(msg, "From"),
    to: header(msg, "To"),
    subject: header(msg, "Subject"),
    date: header(msg, "Date"),
    text,
    html,
  };
}

// Walk the (nested) MIME tree and collect parts that are real attachments.
function collectAttachments(part: GmailPart | undefined): GmailPart[] {
  if (!part) return [];
  const here =
    part.filename && part.body?.attachmentId
      ? [part]
      : [];
  return here.concat((part.parts ?? []).flatMap(collectAttachments));
}

// List attachments of a single message: filename, mimeType, size, attachmentId.
export async function listGmailAttachments(
  connectionId: string,
  messageId: string
): Promise<unknown> {
  const msg = (await gmailFetch(
    connectionId,
    `/users/me/messages/${messageId}?format=full`
  )) as { payload?: GmailPart };

  const attachments = collectAttachments(msg.payload).map((p) => ({
    attachmentId: p.body!.attachmentId,
    filename: p.filename,
    mimeType: p.mimeType,
    size: p.body!.size,
  }));

  return { messageId, attachments };
}

// Fetch one attachment's bytes. Gmail returns base64url; re-encode to standard
// base64 so callers can decode it with any standard tool.
export async function getGmailAttachment(
  connectionId: string,
  messageId: string,
  attachmentId: string
): Promise<unknown> {
  const att = (await gmailFetch(
    connectionId,
    `/users/me/messages/${messageId}/attachments/${attachmentId}`
  )) as { data?: string; size?: number };

  const dataB64 = att.data
    ? Buffer.from(att.data, "base64url").toString("base64")
    : "";

  return { messageId, attachmentId, size: att.size, encoding: "base64", data: dataB64 };
}

// Strip CR/LF so a header field value can't inject extra headers (e.g. Bcc:) into the raw MIME message.
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

// Build an RFC 2822 message and base64url-encode it for the Gmail send endpoint.
export function buildRawEmail(to: string, subject: string, body: string): string {
  const mime = [
    `To: ${sanitizeHeaderValue(to)}`,
    `Subject: ${sanitizeHeaderValue(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  return Buffer.from(mime, "utf-8").toString("base64url");
}
