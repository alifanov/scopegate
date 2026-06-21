import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValidAccessToken } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";
import { downloadImage } from "../image-utils";
import { readBodyWithLimit } from "../media-body";
import { youtubeUploadVideo } from "../youtube";

vi.mock("@/lib/mcp/safe-fetch", () => ({
  safeFetch: vi.fn(),
}));

vi.mock("@/lib/oauth-token-lifecycle", () => ({
  getValidAccessToken: vi.fn(),
}));

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

describe("media body downloads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads a response body into a buffer when it stays within the limit", async () => {
    const res = new Response(
      streamFromChunks([new Uint8Array([1, 2]), new Uint8Array([3])])
    );

    await expect(readBodyWithLimit(res, 3, "Image")).resolves.toEqual(
      Buffer.from([1, 2, 3])
    );
  });

  it("cancels streaming image downloads that exceed the limit without Content-Length", async () => {
    let canceled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(5 * 1024 * 1024));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        canceled = true;
      },
    });

    vi.mocked(safeFetch).mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { "content-type": "image/png" },
      })
    );

    await expect(downloadImage("https://example.com/image.png")).rejects.toThrow(
      "Image too large"
    );
    expect(canceled).toBe(true);
  });

  it("rejects video downloads that stream past the limit without Content-Length", async () => {
    const fakeOversizedChunk = { byteLength: 256 * 1024 * 1024 + 1 } as Uint8Array;
    let canceled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(fakeOversizedChunk);
      },
      cancel() {
        canceled = true;
      },
    });

    vi.mocked(getValidAccessToken).mockResolvedValue("token-1");
    vi.mocked(safeFetch).mockResolvedValue(
      {
        ok: true,
        headers: new Headers({ "content-type": "video/mp4" }),
        body,
      } as Response
    );

    await expect(
      youtubeUploadVideo("conn-1", "https://example.com/video.mp4", {
        title: "Demo",
      })
    ).rejects.toThrow("Video too large");
    expect(canceled).toBe(true);
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects responses with Content-Length over the limit before reading the body", async () => {
    const res = new Response(streamFromChunks([new Uint8Array([1])]), {
      headers: { "content-length": "4" },
    });

    await expect(readBodyWithLimit(res, 3, "Image")).rejects.toThrow(
      "Image too large"
    );
  });
});
