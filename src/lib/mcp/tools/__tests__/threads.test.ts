import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { threadsFetch, ThreadsApiError } from "../../threads";

vi.mock("../../threads", async (importActual) => {
  const actual = await importActual<typeof import("../../threads")>();
  return { ...actual, threadsFetch: vi.fn() };
});

import { threadsTools } from "../threads";

// Shared container-poll/timeout primitives (computeStepTimeout, shouldStopPolling,
// classifyContainerStatus, waitForContainerReady) are unit-tested in container-poll.test.ts.

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls the container until FINISHED before publishing text posts too", async () => {
    // Freeze Date.now() so the budget math (deadline - now - reserve) is deterministic —
    // real elapsed ms between the handler's Date.now() calls made this flaky (4499 vs 4500).
    vi.spyOn(Date, "now").mockReturnValue(0);
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
    vi.spyOn(Date, "now").mockReturnValue(0);
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
        // media publish gets the rest of the 24s budget, not the 3.5s TEXT cap
        timeout: 24_000,
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

  it("retries a transient 500 code=1 publish error and succeeds", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-r" }) // create container
      .mockResolvedValueOnce({ status: "FINISHED" }) // status poll (wait_container)
      .mockRejectedValueOnce(
        new ThreadsApiError("Threads API error (500) code=1: An unknown error has occurred.", 500, 1)
      ) // publish attempt 1 — Meta's transient 500
      .mockResolvedValueOnce({ status: "FINISHED" }) // confirm poll — not published, terminal
      .mockResolvedValueOnce({ id: "thread-r" }); // publish attempt 2 succeeds

    await expect(
      publishThreadTool.handler(
        { media_type: "TEXT", text: "Hello" },
        { serviceConnectionId: "conn-r" }
      )
    ).resolves.toEqual({ id: "thread-r" });

    // create + wait poll + publish#1 + confirm poll + publish#2 = 5 calls
    expect(threadsFetch).toHaveBeenCalledTimes(5);
  });

  it("does not retry a non-transient publish error (e.g. 400)", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-4xx" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockRejectedValueOnce(
        new ThreadsApiError("Threads API error (400) code=100: Invalid parameter", 400, 100)
      ) // publish — permanent client error
      .mockResolvedValueOnce({ status: "FINISHED" }); // confirm poll — not published

    await expect(
      publishThreadTool.handler(
        { media_type: "TEXT", text: "Hello" },
        { serviceConnectionId: "conn-4xx" }
      )
    ).rejects.toThrow("code=100");

    // create + wait poll + publish#1 + confirm poll, then throws — no second publish
    expect(threadsFetch).toHaveBeenCalledTimes(4);
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

  it("gives a late carousel publish whatever is left of the budget", async () => {
    // Publish starts 14s into the 24s media budget (the observed 7-slide timing):
    // it must get the remaining 10s, where the old flat cap gave it 3.5s.
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "item-0" })
      .mockResolvedValueOnce({ id: "item-1" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ id: "carousel-late" })
      .mockImplementationOnce(async () => {
        now = 14_000; // carousel poll returns late
        return { status: "FINISHED" };
      })
      .mockResolvedValueOnce({ id: "thread-late" });

    await publishThreadTool.handler(
      {
        media_type: "CAROUSEL",
        items: [
          { type: "IMAGE", url: "https://example.com/a.png" },
          { type: "IMAGE", url: "https://example.com/b.png" },
        ],
      },
      { serviceConnectionId: "conn-late" }
    );

    expect(threadsFetch).toHaveBeenLastCalledWith("conn-late", "/me/threads_publish", {
      method: "POST",
      body: JSON.stringify({ creation_id: "carousel-late" }),
      timeout: 10_000,
      retry: false,
    });
  });

  it("keeps polling through FINISHED after a publish timeout and reports the post as published", async () => {
    vi.useFakeTimers();
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-lag" }) // create
      .mockResolvedValueOnce({ status: "FINISHED" }) // wait_container
      .mockRejectedValueOnce(new Error("Threads API timed out (>3500ms).")) // publish in flight
      .mockResolvedValueOnce({ status: "FINISHED" }) // confirm #1 — flip still lagging
      .mockResolvedValueOnce({ status: "PUBLISHED" }); // confirm #2

    const result = publishThreadTool.handler(
      { media_type: "TEXT", text: "Hello" },
      { serviceConnectionId: "conn-lag" }
    );
    await vi.runAllTimersAsync();

    await expect(result).resolves.toMatchObject({ status: "success", published: true });
    expect(threadsFetch).toHaveBeenCalledTimes(5);
  });

  it.each(["ERROR", "EXPIRED"])(
    "stops confirming at once on a %s container after a publish timeout",
    async (status) => {
      vi.mocked(threadsFetch)
        .mockResolvedValueOnce({ id: "container-t" })
        .mockResolvedValueOnce({ status: "FINISHED" })
        .mockRejectedValueOnce(new Error("Threads API timed out (>3500ms)."))
        .mockResolvedValueOnce({ status });

      await expect(
        publishThreadTool.handler(
          { media_type: "TEXT", text: "Hello" },
          { serviceConnectionId: "conn-t" }
        )
      ).rejects.toThrow("Threads API timed out");

      // create + wait poll + publish + ONE confirm poll
      expect(threadsFetch).toHaveBeenCalledTimes(4);
    }
  );

  it("retries publish after code=24 once the carousel container is really FINISHED", async () => {
    vi.useFakeTimers();
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "item-0" })
      .mockResolvedValueOnce({ id: "item-1" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ id: "carousel-24" })
      .mockResolvedValueOnce({ status: "FINISHED" }) // premature FINISHED
      .mockRejectedValueOnce(
        new ThreadsApiError("Threads API error (400) code=24: The requested resource does not exist", 400, 24)
      )
      .mockResolvedValueOnce({ status: "IN_PROGRESS" }) // confirm — Meta flipped it back
      .mockResolvedValueOnce({ status: "FINISHED" }) // confirm — really ready, not published
      .mockResolvedValueOnce({ id: "thread-24" }); // publish #2

    const result = publishThreadTool.handler(
      {
        media_type: "CAROUSEL",
        items: [
          { type: "IMAGE", url: "https://example.com/a.png" },
          { type: "IMAGE", url: "https://example.com/b.png" },
        ],
      },
      { serviceConnectionId: "conn-24" }
    );
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual({ id: "thread-24" });
    expect(threadsFetch).toHaveBeenCalledTimes(10);
  });

  it("retries creating the carousel container once on 400 code=100", async () => {
    vi.useFakeTimers();
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "item-0" })
      .mockResolvedValueOnce({ id: "item-1" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockRejectedValueOnce(
        new ThreadsApiError("Threads API error (400) code=100: Invalid parameter", 400, 100)
      )
      .mockResolvedValueOnce({ id: "carousel-100" }) // retry succeeds
      .mockResolvedValueOnce({ status: "FINISHED" })
      .mockResolvedValueOnce({ id: "thread-100" });

    const result = publishThreadTool.handler(
      {
        media_type: "CAROUSEL",
        items: [
          { type: "IMAGE", url: "https://example.com/a.png" },
          { type: "IMAGE", url: "https://example.com/b.png" },
        ],
      },
      { serviceConnectionId: "conn-100" }
    );
    await vi.runAllTimersAsync();

    await expect(result).resolves.toEqual({ id: "thread-100" });
    expect(threadsFetch).toHaveBeenNthCalledWith(6, "conn-100", "/me/threads", expect.objectContaining({
      body: JSON.stringify({ media_type: "CAROUSEL", children: "item-0,item-1" }),
    }));
  });

  it("publishes a carousel: parallel item containers → carousel container → publish", async () => {
    vi.spyOn(Date, "now").mockReturnValue(0);
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
      timeout: 24_000, // remaining media budget, not the 3.5s TEXT cap
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
