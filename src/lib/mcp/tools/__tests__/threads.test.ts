import { beforeEach, describe, expect, it, vi } from "vitest";
import { threadsFetch } from "../../threads";

vi.mock("../../threads", () => ({
  threadsFetch: vi.fn(),
}));

import { threadsTools } from "../threads";

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
        timeout: 8_000,
      }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      2,
      "conn-1",
      "/container-1?fields=status,error_message",
      { timeout: 5_000 }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      3,
      "conn-1",
      "/me/threads_publish",
      {
        method: "POST",
        body: JSON.stringify({ creation_id: "container-1" }),
        timeout: 8_000,
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
        timeout: 8_000,
      }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      2,
      "conn-2",
      "/container-2?fields=status,error_message",
      { timeout: 5_000 }
    );
    expect(threadsFetch).toHaveBeenNthCalledWith(
      3,
      "conn-2",
      "/me/threads_publish",
      {
        method: "POST",
        body: JSON.stringify({ creation_id: "container-2" }),
        timeout: 8_000,
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
