import { describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  it("rounds timestamps to the current minute and allows counts at the limit", async () => {
    const database = {
      $queryRaw: vi.fn().mockResolvedValue([{ count: 60 }]),
    };

    const decision = await checkRateLimit({
      endpointId: "endpoint-1",
      limitPerMinute: 60,
      now: new Date("2026-06-22T12:34:56.789Z"),
      database,
    });

    expect(decision).toEqual({
      allowed: true,
      count: 60,
      windowStart: new Date("2026-06-22T12:34:00.000Z"),
    });
    expect(database.$queryRaw).toHaveBeenCalledOnce();
  });

  it("rejects counts above the configured per-minute limit", async () => {
    const database = {
      $queryRaw: vi.fn().mockResolvedValue([{ count: 61 }]),
    };

    const decision = await checkRateLimit({
      endpointId: "endpoint-1",
      limitPerMinute: 60,
      now: new Date("2026-06-22T12:34:01.000Z"),
      database,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.count).toBe(61);
  });
});
