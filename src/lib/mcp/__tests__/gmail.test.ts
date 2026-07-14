import { describe, expect, it } from "vitest";
import { buildRawEmail } from "@/lib/mcp/gmail";

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
