import { describe, expect, it, vi } from "vitest";
import {
  isRetriableNetworkError,
  retry,
  retryAfterDelayMs,
} from "@/lib/mcp/retry";

describe("mcp retry helpers", () => {
  it("classifies transient network errors without retrying timeouts", () => {
    const reset = Object.assign(new Error("reset"), { code: "ECONNRESET" });
    const refused = Object.assign(new Error("refused"), { code: "ECONNREFUSED" });
    const timeout = new Error("timeout");
    timeout.name = "TimeoutError";

    expect(isRetriableNetworkError(reset)).toBe(true);
    expect(isRetriableNetworkError(refused)).toBe(true);
    expect(isRetriableNetworkError(timeout)).toBe(false);
    expect(isRetriableNetworkError(new Error("no code"))).toBe(false);
  });

  it("retries results with the configured backoff", async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const promise = retry(operation, {
      delaysMs: [25],
      shouldRetryResult: (res) => res.status >= 500,
    });

    await vi.advanceTimersByTimeAsync(25);
    await expect(promise).resolves.toMatchObject({ status: 200 });
    expect(operation).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("parses Retry-After seconds and HTTP dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00.000Z"));

    expect(retryAfterDelayMs("3", 1000)).toBe(3000);
    expect(retryAfterDelayMs("Mon, 22 Jun 2026 12:00:05 GMT", 1000)).toBe(5000);
    expect(retryAfterDelayMs("invalid", 1000)).toBe(1000);

    vi.useRealTimers();
  });
});
