import { describe, expect, it } from "vitest";
import { simpleParseEmail } from "@/lib/mcp/email-parser";

describe("simpleParseEmail", () => {
  it("extracts text and html from a multipart/alternative message", () => {
    const source =
      'Content-Type: multipart/alternative; boundary="B"\r\n\r\n' +
      "--B\r\n" +
      "Content-Type: text/plain\r\n\r\n" +
      "plain body\r\n" +
      "--B\r\n" +
      "Content-Type: text/html\r\n\r\n" +
      "<p>html body</p>\r\n" +
      "--B--";

    expect(simpleParseEmail(source)).toEqual({
      text: "plain body",
      html: "<p>html body</p>",
    });
  });

  it("decodes base64 transfer-encoded parts", () => {
    const body = Buffer.from("decoded body", "utf-8").toString("base64");
    const source =
      'Content-Type: multipart/mixed; boundary="B"\r\n\r\n' +
      "--B\r\n" +
      "Content-Type: text/plain\r\n" +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      body +
      "\r\n" +
      "--B--";

    expect(simpleParseEmail(source).text).toBe("decoded body");
  });

  it("decodes quoted-printable transfer-encoded parts", () => {
    const source =
      'Content-Type: multipart/mixed; boundary="B"\r\n\r\n' +
      "--B\r\n" +
      "Content-Type: text/plain\r\n" +
      "Content-Transfer-Encoding: quoted-printable\r\n\r\n" +
      "caf=C3=A9\r\n" +
      "--B--";

    // Quoted-printable bytes are decoded via fromCharCode, not re-encoded as UTF-8.
    expect(simpleParseEmail(source).text).toBe("cafÃ©");
  });

  it("parses a single-part text/plain message", () => {
    const source = "Content-Type: text/plain\r\n\r\nhello world";
    expect(simpleParseEmail(source)).toEqual({ text: "hello world", html: "" });
  });

  it("parses a single-part text/html message, deriving text via stripHtml", () => {
    const source = "Content-Type: text/html\r\n\r\n<p>hi</p>";
    expect(simpleParseEmail(source)).toEqual({ text: "hi", html: "<p>hi</p>" });
  });

  it("falls back to text/plain when Content-Type is absent", () => {
    const source = "\r\n\r\nno headers here";
    expect(simpleParseEmail(source).text).toBe("no headers here");
  });

  it("derives text from html via stripHtml when only html is present", () => {
    const source =
      'Content-Type: multipart/alternative; boundary="B"\r\n\r\n' +
      "--B\r\n" +
      "Content-Type: text/html\r\n\r\n" +
      "<p>Hello&nbsp;&amp;&lt;World&gt;</p>" +
      "\r\n--B--";

    expect(simpleParseEmail(source)).toEqual({
      text: "Hello &<World>",
      html: "<p>Hello&nbsp;&amp;&lt;World&gt;</p>",
    });
  });
});
