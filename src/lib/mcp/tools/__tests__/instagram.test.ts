import { beforeEach, describe, expect, it, vi } from "vitest";
import { instagramFetch } from "../../instagram";

vi.mock("../../instagram", async (importActual) => {
  const actual = await importActual<typeof import("../../instagram")>();
  return { ...actual, instagramFetch: vi.fn() };
});

import { instagramTools } from "../instagram";

const createPostTool = instagramTools.find(
  (tool) => tool.name === "instagram_create_post"
);

if (!createPostTool) {
  throw new Error("instagram_create_post tool is not registered");
}

describe("instagram_create_post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("polls the container until FINISHED before publishing an image post", async () => {
    vi.mocked(instagramFetch)
      .mockResolvedValueOnce({ id: "container-1" }) // create container
      .mockResolvedValueOnce({ status_code: "FINISHED" }) // status poll
      .mockResolvedValueOnce({ id: "media-1" }); // publish

    await expect(
      createPostTool.handler(
        { media_type: "IMAGE", image_url: "https://example.com/a.jpg" },
        { serviceConnectionId: "conn-1" }
      )
    ).resolves.toEqual({ id: "media-1" });

    expect(instagramFetch).toHaveBeenNthCalledWith(1, "conn-1", "/me/media", {
      method: "POST",
      body: JSON.stringify({ image_url: "https://example.com/a.jpg" }),
      timeout: 18_000,
      retry: false,
    });
    expect(instagramFetch).toHaveBeenNthCalledWith(
      2,
      "conn-1",
      "/container-1?fields=status_code",
      { timeout: 2_500, retry: false }
    );
    expect(instagramFetch).toHaveBeenNthCalledWith(3, "conn-1", "/me/media_publish", {
      method: "POST",
      body: JSON.stringify({ creation_id: "container-1" }),
      timeout: 4_000,
      retry: false,
    });
  });

  it("throws when Meta reports the media container failed processing", async () => {
    vi.mocked(instagramFetch)
      .mockResolvedValueOnce({ id: "container-err" })
      .mockResolvedValueOnce({ status_code: "ERROR" });

    await expect(
      createPostTool.handler(
        { media_type: "REELS", video_url: "https://example.com/video.mp4" },
        { serviceConnectionId: "conn-err" }
      )
    ).rejects.toThrow("Instagram media processing error: unknown error");

    // create + one status poll, never publishes
    expect(instagramFetch).toHaveBeenCalledTimes(2);
  });

  it("returns partial success when the container is still processing at the budget deadline", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValueOnce(21_001);
    vi.mocked(instagramFetch).mockResolvedValueOnce({ id: "container-3" });

    await expect(
      createPostTool.handler(
        { media_type: "REELS", video_url: "https://example.com/video.mp4" },
        { serviceConnectionId: "conn-3" }
      )
    ).resolves.toEqual({
      status: "partial_success",
      creation_id: "container-3",
      message:
        "Instagram container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
    });

    expect(instagramFetch).toHaveBeenCalledTimes(1);
  });

  it("publishes a carousel: parallel child containers → carousel container → publish", async () => {
    vi.mocked(instagramFetch)
      .mockResolvedValueOnce({ id: "child-0" }) // create child 0
      .mockResolvedValueOnce({ id: "child-1" }) // create child 1
      .mockResolvedValueOnce({ status_code: "FINISHED" }) // poll child 0
      .mockResolvedValueOnce({ status_code: "FINISHED" }) // poll child 1
      .mockResolvedValueOnce({ id: "carousel-1" }) // create carousel container
      .mockResolvedValueOnce({ status_code: "FINISHED" }) // poll carousel
      .mockResolvedValueOnce({ id: "media-carousel" }); // publish

    await expect(
      createPostTool.handler(
        {
          media_type: "CAROUSEL",
          caption: "My carousel",
          items: [
            { type: "IMAGE", url: "https://example.com/a.jpg" },
            { type: "VIDEO", url: "https://example.com/b.mp4" },
          ],
        },
        { serviceConnectionId: "conn-c" }
      )
    ).resolves.toEqual({ id: "media-carousel" });

    expect(instagramFetch).toHaveBeenNthCalledWith(5, "conn-c", "/me/media", {
      method: "POST",
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: "child-0,child-1",
        caption: "My carousel",
      }),
      timeout: 18_000,
      retry: false,
    });
    expect(instagramFetch).toHaveBeenNthCalledWith(7, "conn-c", "/me/media_publish", {
      method: "POST",
      body: JSON.stringify({ creation_id: "carousel-1" }),
      timeout: 4_000,
      retry: false,
    });
  });

  it("returns partial success when a carousel child is still processing at the deadline", async () => {
    vi.mocked(instagramFetch)
      .mockResolvedValueOnce({ id: "child-0" })
      .mockResolvedValueOnce({ id: "child-1" });
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(0) // handler deadline anchor: deadline = 0 + 25_000
      .mockReturnValue(21_001); // every subsequent poll check: childDeadline (21_000) already passed

    await expect(
      createPostTool.handler(
        {
          media_type: "CAROUSEL",
          items: [
            { type: "IMAGE", url: "https://example.com/a.jpg" },
            { type: "VIDEO", url: "https://example.com/b.mp4" },
          ],
        },
        { serviceConnectionId: "conn-partial" }
      )
    ).resolves.toEqual({
      status: "partial_success",
      child_ids: ["child-0", "child-1"],
      message:
        "Carousel child containers were created, but some were still processing when the safe execution budget ran out. Retry the whole carousel.",
    });

    // 2 child creations, no status polls (deadline already passed), no carousel container
    expect(instagramFetch).toHaveBeenCalledTimes(2);
  });

  it("rejects a CAROUSEL with fewer than 2 items without calling Meta", async () => {
    await expect(
      createPostTool.handler(
        {
          media_type: "CAROUSEL",
          items: [{ type: "IMAGE", url: "https://example.com/a.jpg" }],
        },
        { serviceConnectionId: "conn-x" }
      )
    ).rejects.toThrow("CAROUSEL requires items[] with 2-10 media entries");

    expect(instagramFetch).not.toHaveBeenCalled();
  });
});
