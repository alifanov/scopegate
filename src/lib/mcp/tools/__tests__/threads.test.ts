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

  it("uses separate short timeouts for text container creation and publish", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-1" })
      .mockResolvedValueOnce({ id: "thread-1" });

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
      "/me/threads_publish",
      {
        method: "POST",
        body: JSON.stringify({ creation_id: "container-1" }),
        timeout: 8_000,
      }
    );
  });

  it("uses an explicit media container timeout before publishing media posts", async () => {
    vi.mocked(threadsFetch)
      .mockResolvedValueOnce({ id: "container-2" })
      .mockResolvedValueOnce({ id: "thread-2" });

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
        timeout: 12_000,
      }
    );
  });

  it("returns partial success instead of starting publish after the safe budget", async () => {
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
        "Threads media container was created, but publishing was skipped because the request exceeded the safe execution budget. Retry publishing with this creation_id.",
    });

    expect(threadsFetch).toHaveBeenCalledTimes(1);
  });
});
