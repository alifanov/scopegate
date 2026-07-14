import { beforeEach, describe, expect, it, vi } from "vitest";
import { threadsFetch } from "../../threads";

vi.mock("../../threads", () => ({
  threadsFetch: vi.fn(),
}));

import {
  classifyContainerStatus,
  computeStepTimeout,
  shouldStopPolling,
  threadsTools,
} from "../threads";

describe("computeStepTimeout", () => {
  it("uses the preferred timeout when plenty of budget remains", () => {
    expect(computeStepTimeout(4_500, /* deadline */ 20_000, /* now */ 0, /* reserve */ 3_500)).toBe(4_500);
  });

  it("caps to the remaining budget minus the reserve when that is smaller", () => {
    // deadline - now - reserve = 10_000 - 8_000 - 1_000 = 1_000 < preferred
    expect(computeStepTimeout(4_500, 10_000, 8_000, 1_000)).toBe(1_000);
  });

  it("floors at minMs even when the budget is already exhausted", () => {
    expect(computeStepTimeout(4_500, 10_000, 9_900, 1_000)).toBe(1_000);
    expect(computeStepTimeout(4_500, 5_000, 20_000, 1_000, 500)).toBe(500);
  });

  it("respects a custom minMs floor", () => {
    expect(computeStepTimeout(4_500, 10_000, 9_999, 1_000, 250)).toBe(250);
  });
});

describe("shouldStopPolling", () => {
  it("returns false when another interval fits before the deadline", () => {
    expect(shouldStopPolling(0, 10_000, 1_000)).toBe(false);
  });

  it("returns true once the next interval would reach or pass the deadline", () => {
    expect(shouldStopPolling(9_000, 10_000, 1_000)).toBe(true);
    expect(shouldStopPolling(9_500, 10_000, 1_000)).toBe(true);
  });
});

describe("classifyContainerStatus", () => {
  it("classifies FINISHED as ready", () => {
    expect(classifyContainerStatus({ status: "FINISHED" })).toEqual({ kind: "ready" });
  });

  it("classifies IN_PROGRESS (and undefined) as pending", () => {
    expect(classifyContainerStatus({ status: "IN_PROGRESS" })).toEqual({ kind: "pending" });
    expect(classifyContainerStatus({})).toEqual({ kind: "pending" });
  });

  it("classifies ERROR/EXPIRED as failed with a descriptive message", () => {
    expect(classifyContainerStatus({ status: "ERROR", error_message: "bad format" })).toEqual({
      kind: "failed",
      message: "Threads media processing error: bad format",
    });
    expect(classifyContainerStatus({ status: "EXPIRED" })).toEqual({
      kind: "failed",
      message: "Threads media processing expired: unknown error",
    });
  });
});

const publishThreadTool = threadsTools.find(
  (tool) => tool.name === "threads_publish_thread"
);

if (!publishThreadTool) {
  throw new Error("threads_publish_thread tool is not registered");
}

describe("threads_publish_thread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("polls the container until FINISHED before publishing text posts too", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-1" }) // create container
      .mockResolvedValueOnce({ status: "FINISHED" }) // status poll
      .mockResolvedValueOnce({ id: "thread-1" }); // publish

    await expect(
      publishThreadTool.handler(
        { media_type: "TEXT", text: "Hello" },
        { serviceConnectionId: "conn-1" }
      )
    ).resolves.toEqual({ id: "thread-1" });

    expect(threadsFetch).toHaveBeenNthCalledWith(
      1,
      "conn-1",
      "/me/threads",
      {
        method: "POST",
        body: JSON.stringify({ media_type: "TEXT", text: "Hello" }),
        timeout: 4_500,
        retry: false,
      }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      2,
      "conn-1",
      "/container-1?fields=status,error_message",
      { timeout: 2_500, retry: false }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      3,
      "conn-1",
      "/me/threads_publish",
      {
        method: "POST",
        body: JSON.stringify({ creation_id: "container-1" }),
        timeout: 3_500,
        retry: false,
      }
    );
  });

  it("polls the media container until FINISHED before publishing media posts", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-2" }) // create container
      .mockResolvedValueOnce({ status: "FINISHED" }) // status poll
      .mockResolvedValueOnce({ id: "thread-2" }); // publish

    await publishThreadTool.handler(
      {
        media_type: "IMAGE",
        text: "Image post",
        image_url: "https://example.com/image.jpg",
      },
      { serviceConnectionId: "conn-2" }
    );

    expect(threadsFetch).toHaveBeenNthCalledWith(
      1,
      "conn-2",
      "/me/threads",
      {
        method: "POST",
        body: JSON.stringify({
          media_type: "IMAGE",
          text: "Image post",
          image_url: "https://example.com/image.jpg",
        }),
        timeout: 18_000,
        retry: false,
      }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      2,
      "conn-2",
      "/container-2?fields=status,error_message",
      { timeout: 2_500, retry: false }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      3,
      "conn-2",
      "/me/threads_publish",
      {
        method: "POST",
        body: JSON.stringify({ creation_id: "container-2" }),
        timeout: 3_500,
        retry: false,
      }
    );
  });

  it("throws when Meta reports the media container failed processing", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-err" })
      .mockResolvedValueOnce({ status: "ERROR", error_message: "Unsupported format" });

    await expect(
      publishThreadTool.handler(
        { media_type: "VIDEO", video_url: "https://example.com/video.mp4" },
        { serviceConnectionId: "conn-err" }
      )
    ).rejects.toThrow("Threads media processing error: Unsupported format");

    // create + one status poll, never publishes
    expect(threadsFetch).toHaveBeenCalledTimes(2);
  });

  it("returns success when publish fails but the post actually went live", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-live" }) // create container
      .mockResolvedValueOnce({ status: "FINISHED" }) // status poll (wait_container)
      .mockRejectedValueOnce(new Error("Threads API timed out (>3500ms).")) // publish errors
      .mockResolvedValueOnce({ status: "PUBLISHED" }); // confirmation poll

    await expect(
      publishThreadTool.handler(
        { media_type: "TEXT", text: "Hello" },
        { serviceConnectionId: "conn-live" }
      )
    ).resolves.toEqual({
      status: "success",
      published: true,
      creation_id: "container-live",
      message:
        "Thread was published — confirmed via container status after the publish response failed. Do not retry.",
    });
  });

  it("rethrows the publish error when the post did not go live", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-dead" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockRejectedValueOnce(new Error("Threads API timed out (>3500ms).")) // publish errors
      .mockResolvedValueOnce({ status: "IN_PROGRESS" }); // confirmation never reaches PUBLISHED

    await expect(
      publishThreadTool.handler(
        { media_type: "TEXT", text: "Hello" },
        { serviceConnectionId: "conn-dead" }
      )
    ).rejects.toThrow("Threads API timed out");
  });

  it("publishes a carousel: parallel item containers → carousel container → publish", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "item-0" }) // create item 0
      .mockResolvedValueOnce({ id: "item-1" }) // create item 1
      .mockResolvedValueOnce({ status: "FINISHED" }) // poll item 0
      .mockResolvedValueOnce({ status: "FINISHED" }) // poll item 1
      .mockResolvedValueOnce({ id: "carousel-1" }) // create carousel container
      .mockResolvedValueOnce({ status: "FINISHED" }) // poll carousel
      .mockResolvedValueOnce({ id: "thread-carousel" }); // publish

    await expect(
      publishThreadTool.handler(
        {
          media_type: "CAROUSEL",
          text: "My carousel",
          items: [
            { type: "IMAGE", url: "https://example.com/a.jpg" },
            { type: "VIDEO", url: "https://example.com/b.mp4" },
          ],
        },
        { serviceConnectionId: "conn-c" }
      )
    ).resolves.toEqual({ id: "thread-carousel" });

    // item 0 container — is_carousel_item, image_url
    expect(threadsFetch).toHaveBeenNthCalledWith(1, "conn-c", "/me/threads", {
      method: "POST",
      body: JSON.stringify({
        media_type: "IMAGE",
        is_carousel_item: "true",
        image_url: "https://example.com/a.jpg",
      }),
      timeout: 18_000,
      retry: false,
    });
    // item 1 container — is_carousel_item, video_url
    expect(threadsFetch).toHaveBeenNthCalledWith(2, "conn-c", "/me/threads", {
      method: "POST",
      body: JSON.stringify({
        media_type: "VIDEO",
        is_carousel_item: "true",
        video_url: "https://example.com/b.mp4",
      }),
      timeout: 18_000,
      retry: false,
    });
    // carousel container references both children with the caption
    expect(threadsFetch).toHaveBeenNthCalledWith(5, "conn-c", "/me/threads", {
      method: "POST",
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: "item-0,item-1",
        text: "My carousel",
      }),
      timeout: 18_000,
      retry: false,
    });
    // publishes the carousel container
    expect(threadsFetch).toHaveBeenNthCalledWith(7, "conn-c", "/me/threads_publish", {
      method: "POST",
      body: JSON.stringify({ creation_id: "carousel-1" }),
      timeout: 3_500,
      retry: false,
    });
  });

  it("rejects a CAROUSEL with fewer than 2 items without calling Meta", async () => {
    await expect(
      publishThreadTool.handler(
        {
          media_type: "CAROUSEL",
          items: [{ type: "IMAGE", url: "https://example.com/a.jpg" }],
        },
        { serviceConnectionId: "conn-x" }
      )
    ).rejects.toThrow("CAROUSEL requires items[] with 2-20 media entries");

    expect(threadsFetch).not.toHaveBeenCalled();
  });

  it("returns partial success when the container is still processing at the budget deadline", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValueOnce(25_001);
    vi.mocked(threadsFetch).mockResolvedValueOnce({ id: "container-3" });

    await expect(
      publishThreadTool.handler(
        { media_type: "VIDEO", video_url: "https://example.com/video.mp4" },
        { serviceConnectionId: "conn-3" }
      )
    ).resolves.toEqual({
      status: "partial_success",
      creation_id: "container-3",
      message:
        "Threads container was created, but it was still processing when the safe execution budget ran out. Retry publishing with this creation_id once processing finishes.",
    });

    expect(threadsFetch).toHaveBeenCalledTimes(1);
  });
});
