import { describe, expect, it } from "vitest";
import {
  buildRawEmail,
  collectAttachments,
  findBody,
  header,
  stripHtml,
  type GmailPart,
} from "@/lib/mcp/gmail";

function decode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf-8");
}

describe("buildRawEmail", () => {
  it("builds a well-formed MIME message for clean inputs", () => {
    const mime = decode(buildRawEmail("v@x.com", "Hi", "body"));

    expect(mime).toContain("To: v@x.com\r\n");
    expect(mime).toContain("Subject: Hi\r\n");
  });

  it("strips CRLF from subject to prevent header injection", () => {
    const mime = decode(
      buildRawEmail("v@x.com", "Hi\r\nBcc: e@evil.com\r\nX-Injected: yes", "body"),
    );

    expect(mime).not.toMatch(/^Bcc:/m);
    expect(mime).not.toMatch(/^X-Injected:/m);
    expect(mime).toContain("Subject: Hi Bcc: e@evil.com X-Injected: yes\r\n");
  });

  it("strips CRLF from the to field", () => {
    const mime = decode(buildRawEmail("v@x.com\r\nBcc: e@evil.com", "Hi", "body"));

    expect(mime).not.toMatch(/^Bcc:/m);
  });
});

function b64(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64url");
}

describe("findBody", () => {
  it("returns the inline body matching the requested mimeType", () => {
    const part: GmailPart = {
      mimeType: "text/plain",
      body: { data: b64("hello world") },
    };

    expect(findBody(part, "text/plain")).toBe("hello world");
  });

  it("recurses into nested multipart parts to find the match", () => {
    const part: GmailPart = {
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: b64("plain text") } },
        { mimeType: "text/html", body: { data: b64("<p>html</p>") } },
      ],
    };

    expect(findBody(part, "text/html")).toBe("<p>html</p>");
    expect(findBody(part, "text/plain")).toBe("plain text");
  });

  it("skips parts that have a filename (attachments), even if mimeType matches", () => {
    const part: GmailPart = {
      mimeType: "multipart/mixed",
      parts: [
        { mimeType: "text/plain", filename: "notes.txt", body: { data: b64("attachment") } },
        { mimeType: "text/plain", body: { data: b64("real body") } },
      ],
    };

    expect(findBody(part, "text/plain")).toBe("real body");
  });

  it("returns empty string when no matching part exists", () => {
    expect(findBody({ mimeType: "text/plain", body: { data: b64("x") } }, "text/html")).toBe("");
    expect(findBody(undefined, "text/plain")).toBe("");
  });
});

describe("collectAttachments", () => {
  it("returns parts that have both a filename and an attachmentId", () => {
    const part: GmailPart = {
      mimeType: "multipart/mixed",
      parts: [
        { mimeType: "text/plain", body: { data: b64("body") } },
        { mimeType: "image/png", filename: "photo.png", body: { attachmentId: "att-1", size: 42 } },
      ],
    };

    const attachments = collectAttachments(part);
    expect(attachments).toEqual([
      { mimeType: "image/png", filename: "photo.png", body: { attachmentId: "att-1", size: 42 } },
    ]);
  });

  it("recurses through nested multipart trees", () => {
    const part: GmailPart = {
      parts: [
        {
          parts: [
            { filename: "a.pdf", body: { attachmentId: "att-a", size: 1 } },
            { filename: "b.pdf", body: { attachmentId: "att-b", size: 2 } },
          ],
        },
      ],
    };

    expect(collectAttachments(part).map((p) => p.filename)).toEqual(["a.pdf", "b.pdf"]);
  });

  it("ignores parts with a filename but no attachmentId, and parts with neither", () => {
    const part: GmailPart = {
      parts: [
        { filename: "inline.png", body: {} },
        { mimeType: "text/plain", body: { data: "x" } },
      ],
    };

    expect(collectAttachments(part)).toEqual([]);
  });

  it("returns an empty array for undefined input", () => {
    expect(collectAttachments(undefined)).toEqual([]);
  });
});

describe("stripHtml", () => {
  it("removes tags, style/script blocks, and decodes common entities", () => {
    const html = `<style>p{color:red}</style><p>Hello&nbsp;&amp;&lt;World&gt;</p><script>evil()</script>`;
    expect(stripHtml(html)).toBe("Hello &<World>");
  });

  it("collapses 3+ consecutive newlines to a blank line", () => {
    expect(stripHtml("a\n\n\n\n\nb")).toBe("a\n\nb");
  });
});

describe("header", () => {
  it("finds a header case-insensitively", () => {
    const msg = {
      id: "1",
      threadId: "1",
      payload: { headers: [{ name: "Subject", value: "Hi there" }] },
    };
    expect(header(msg, "subject")).toBe("Hi there");
  });

  it("returns undefined when the header is missing", () => {
    const msg = { id: "1", threadId: "1", payload: { headers: [] } };
    expect(header(msg, "From")).toBeUndefined();
  });
});
