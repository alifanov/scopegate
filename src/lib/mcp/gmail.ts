import { serviceFetch, type ServiceFetchOptions } from "@/lib/mcp/service-fetch";

export async function gmailFetch(
  serviceConnectionId: string,
  path: string,
  init?: ServiceFetchOptions
): Promise<unknown> {
  const res = await serviceFetch(serviceConnectionId, path, init);

  if (!res.ok) {
    console.error(`[ScopeGate] Gmail API error (${res.status})`);
    throw new Error("Gmail API request failed");
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
