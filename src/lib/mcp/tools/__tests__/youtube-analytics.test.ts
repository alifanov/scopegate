import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../youtube", () => ({
  youtubeFetch: vi.fn().mockResolvedValue({ rows: [] }),
  youtubeUploadVideo: vi.fn(),
}));

import { youtubeFetch } from "../../youtube";
import { youtubeTools } from "../youtube";

const tool = youtubeTools.find((t) => t.name === "youtube_get_analytics")!;
const ctx = { serviceConnectionId: "conn-1" };

// Runs params through the tool's own schema, like the MCP handler does — so
// defaults (metrics) are applied here and not only inside the handler.
function call(params: Record<string, unknown>) {
  return tool.handler(tool.inputSchema.parse(params) as Record<string, unknown>, ctx);
}

function lastCall() {
  const [connectionId, path, options] = vi.mocked(youtubeFetch).mock.calls.at(-1)!;
  return { connectionId, path, options, query: new URLSearchParams(path.split("?")[1]) };
}

describe("youtube_get_analytics", () => {
  beforeEach(() => vi.mocked(youtubeFetch).mockClear());

  it("hits the Analytics /reports endpoint on the analytics host", async () => {
    await call({ startDate: "2026-08-17", endDate: "2026-08-24" });

    const { connectionId, path, options, query } = lastCall();
    expect(connectionId).toBe("conn-1");
    expect(path.startsWith("/reports?")).toBe(true);
    expect(options).toEqual({ baseUrlKey: "analytics" });
    expect(query.get("ids")).toBe("channel==MINE");
    expect(query.get("startDate")).toBe("2026-08-17");
    expect(query.get("endDate")).toBe("2026-08-24");
  });

  it("applies the default metric set when metrics is omitted", async () => {
    await call({ startDate: "2026-08-17", endDate: "2026-08-24" });

    expect(lastCall().query.get("metrics")).toContain("estimatedMinutesWatched");
  });

  it("omits optional params that were not passed", async () => {
    await call({ startDate: "2026-08-17", endDate: "2026-08-24" });

    const { query } = lastCall();
    for (const key of ["dimensions", "filters", "sort", "maxResults"]) {
      expect(query.has(key)).toBe(false);
    }
  });

  it("passes retention dimensions and filters through", async () => {
    await call({
      startDate: "2026-08-17",
      endDate: "2026-08-24",
      metrics: "audienceWatchRatio",
      dimensions: "elapsedVideoTimeRatio",
      filters: "video==abc123",
    });

    const { query } = lastCall();
    expect(query.get("metrics")).toBe("audienceWatchRatio");
    expect(query.get("dimensions")).toBe("elapsedVideoTimeRatio");
    expect(query.get("filters")).toBe("video==abc123");
  });

  it("rejects a malformed date", () => {
    expect(() =>
      tool.inputSchema.parse({ startDate: "17.08.2026", endDate: "2026-08-24" })
    ).toThrow();
  });
});
