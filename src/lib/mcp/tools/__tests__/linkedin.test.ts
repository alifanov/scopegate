import { beforeEach, describe, expect, it, vi } from "vitest";

const spans: Array<{
  name: string;
  attributes: Record<string, unknown>;
  setStatus: ReturnType<typeof vi.fn>;
  recordException: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}> = [];

vi.mock("@opentelemetry/api", () => ({
  SpanKind: { INTERNAL: 0 },
  SpanStatusCode: { ERROR: 2 },
  trace: {
    getTracer: () => ({
      startActiveSpan: (
        name: string,
        options: { attributes?: Record<string, unknown> },
        callback: (span: (typeof spans)[number]) => unknown
      ) => {
        const span = {
          name,
          attributes: options.attributes ?? {},
          setStatus: vi.fn(),
          recordException: vi.fn(),
          end: vi.fn(),
        };
        spans.push(span);
        return callback(span);
      },
    }),
  },
}));

vi.mock("../../linkedin", () => ({
  LINKEDIN_CREATE_POST_TIMEOUT_MS: 1_250,
  LINKEDIN_VERSION: "202601",
  getLinkedInMemberUrn: vi.fn(),
  linkedinFetch: vi.fn(),
  linkedinUploadImage: vi.fn(),
}));

vi.mock("../../image-utils", () => ({
  downloadImage: vi.fn(),
}));

import {
  LINKEDIN_CREATE_POST_TIMEOUT_MS,
  getLinkedInMemberUrn,
  linkedinFetch,
  linkedinUploadImage,
} from "../../linkedin";
import { downloadImage } from "../../image-utils";
import { linkedinTools } from "../linkedin";

const createPostTool = linkedinTools.find((tool) => tool.name === "linkedin_create_post");

if (!createPostTool) {
  throw new Error("linkedin_create_post tool is not registered");
}

describe("linkedin_create_post", () => {
  beforeEach(() => {
    spans.length = 0;
    vi.clearAllMocks();
    vi.mocked(getLinkedInMemberUrn).mockResolvedValue("urn:li:person:abc123");
    vi.mocked(linkedinFetch).mockResolvedValue({ success: true, id: "urn:li:share:1" });
  });

  it("adds phase spans around text post payload, request, and response handling", async () => {
    await expect(
      createPostTool.handler(
        { text: "Hello LinkedIn" },
        { serviceConnectionId: "conn-1" }
      )
    ).resolves.toEqual({ success: true, id: "urn:li:share:1" });

    expect(spans.map((span) => span.name)).toEqual([
      "linkedin_create_post.prepare_payload",
      "linkedin_create_post.http_request",
      "linkedin_create_post.process_response",
    ]);
    expect(spans[0].attributes).toMatchObject({
      "mcp.tool": "linkedin_create_post",
      "linkedin.phase": "prepare_payload",
      "linkedin.content_type": "text",
    });
    expect(spans[1].attributes).toMatchObject({
      "http.method": "POST",
      "url.path": "/posts",
      "linkedin.api_version": "202601",
      "linkedin.timeout_ms": LINKEDIN_CREATE_POST_TIMEOUT_MS,
    });
    expect(spans.every((span) => span.end.mock.calls.length === 1)).toBe(true);
  });

  it("keeps the create-post request synchronous with the short LinkedIn timeout", async () => {
    await createPostTool.handler(
      { text: "Hello LinkedIn", link: "https://example.com/post" },
      { serviceConnectionId: "conn-2" }
    );

    expect(linkedinFetch).toHaveBeenCalledWith(
      "conn-2",
      "/posts",
      expect.objectContaining({
        method: "POST",
        timeout: LINKEDIN_CREATE_POST_TIMEOUT_MS,
      })
    );

    const body = JSON.parse(vi.mocked(linkedinFetch).mock.calls[0][2]?.body as string);
    expect(body).toMatchObject({
      author: "urn:li:person:abc123",
      lifecycleState: "PUBLISHED",
      commentary: "Hello LinkedIn",
      content: { article: { source: "https://example.com/post" } },
    });
  });

  it("adds an image preparation span when posting with media", async () => {
    const imageBuffer = Buffer.from("image");
    vi.mocked(downloadImage).mockResolvedValue({
      buffer: imageBuffer,
      mimeType: "image/png",
      sizeBytes: imageBuffer.byteLength,
    });
    vi.mocked(linkedinUploadImage).mockResolvedValue("urn:li:image:1");

    await createPostTool.handler(
      { text: "Image post", image_url: "https://example.com/image.png" },
      { serviceConnectionId: "conn-3" }
    );

    expect(spans.map((span) => span.name)).toEqual([
      "linkedin_create_post.prepare_payload",
      "linkedin_create_post.prepare_image",
      "linkedin_create_post.http_request",
      "linkedin_create_post.process_response",
    ]);

    const body = JSON.parse(vi.mocked(linkedinFetch).mock.calls[0][2]?.body as string);
    expect(body.content).toEqual({ media: { id: "urn:li:image:1" } });
  });
});
