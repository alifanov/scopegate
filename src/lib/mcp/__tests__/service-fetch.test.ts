import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";
import { serviceFetch } from "@/lib/mcp/service-fetch";

const span = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  SpanKind: { CLIENT: 2 },
  SpanStatusCode: { ERROR: 2 },
  trace: {
    getTracer: vi.fn(() => ({
      startActiveSpan: vi.fn((_name, _options, fn) => fn(span)),
    })),
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    serviceConnection: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

vi.mock("@/lib/oauth-token-lifecycle", () => ({
  getValidAccessTokenForConnection: vi.fn(),
}));

vi.mock("@/lib/mcp/safe-fetch", () => ({
  safeFetch: vi.fn(),
}));

describe("serviceFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "linkedin",
    } as never);
    vi.mocked(getValidAccessTokenForConnection).mockResolvedValue("token-1");
  });

  it("applies provider timeout, fixed headers, and registry retry policy", async () => {
    vi.useFakeTimers();
    const onAttempt = vi.fn();
    vi.mocked(safeFetch)
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(new Response("{}", { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const promise = serviceFetch("conn-1", "/posts", { onAttempt });

    await vi.advanceTimersByTimeAsync(150);
    await vi.advanceTimersByTimeAsync(300);

    const res = await promise;
    expect(res.status).toBe(200);
    expect(safeFetch).toHaveBeenCalledTimes(3);
    expect(safeFetch).toHaveBeenLastCalledWith(
      "https://api.linkedin.com/rest/posts",
      expect.objectContaining({
        timeout: 1_400,
        headers: expect.objectContaining({
          Authorization: "Bearer token-1",
          "LinkedIn-Version": "202601",
          "X-Restli-Protocol-Version": "2.0.0",
        }),
      })
    );
    expect(onAttempt).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("does not use GET-only provider retries for POST unless forced", async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response("{}", { status: 500 }));

    const res = await serviceFetch("conn-1", "/posts", { method: "POST" });

    expect(res.status).toBe(500);
    expect(safeFetch).toHaveBeenCalledTimes(1);
  });
});
