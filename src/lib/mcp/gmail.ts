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
  body?: { attachmentId?: string; size?: number };
  parts?: GmailPart[];
};

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

// Build an RFC 2822 message and base64url-encode it for the Gmail send endpoint.
export function buildRawEmail(to: string, subject: string, body: string): string {
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  return Buffer.from(mime, "utf-8").toString("base64url");
}
