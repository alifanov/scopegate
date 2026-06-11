import { beforeEach, describe, expect, it, vi } from "vitest";
import { serviceFetch } from "@/lib/mcp/service-fetch";

vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

import { getOpenRouterCredits } from "../openrouter";

describe("getOpenRouterCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("returns cached credits while they are fresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T00:00:00.000Z"));
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { credits: 12 } }), { status: 200 })
    );

    await expect(getOpenRouterCredits("conn-1")).resolves.toEqual({
      data: { credits: 12 },
    });
    vi.setSystemTime(new Date("2026-06-11T00:04:59.000Z"));
    await expect(getOpenRouterCredits("conn-1")).resolves.toEqual({
      data: { credits: 12 },
    });

    expect(serviceFetch).toHaveBeenCalledTimes(1);
  });

  it("returns stale credits immediately when refresh fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T00:00:00.000Z"));
    vi.mocked(serviceFetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { credits: 12 } }), { status: 200 })
      )
      .mockRejectedValueOnce(new Error("OpenRouter unavailable"));

    await getOpenRouterCredits("conn-2");
    vi.setSystemTime(new Date("2026-06-11T00:05:01.000Z"));

    await expect(getOpenRouterCredits("conn-2")).resolves.toEqual({
      data: { credits: 12 },
    });
    await vi.runAllTicks();

    expect(serviceFetch).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent credits refreshes", async () => {
    vi.mocked(serviceFetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { credits: 12 } }), { status: 200 })
    );

    await expect(
      Promise.all([
        getOpenRouterCredits("conn-3"),
        getOpenRouterCredits("conn-3"),
        getOpenRouterCredits("conn-3"),
      ])
    ).resolves.toEqual([
      { data: { credits: 12 } },
      { data: { credits: 12 } },
      { data: { credits: 12 } },
    ]);

    expect(serviceFetch).toHaveBeenCalledTimes(1);
  });
});
