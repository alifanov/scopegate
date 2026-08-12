import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSpan = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: () => ({
      startActiveSpan: (
        _name: string,
        _options: unknown,
        callback: (span: typeof mockSpan) => unknown
      ) => callback(mockSpan),
    }),
  },
  SpanKind: { CLIENT: 2 },
  SpanStatusCode: { ERROR: 2 },
}));

import { exchangeMetaLongLivedToken } from "../meta-token-exchange";

describe("exchangeMetaLongLivedToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the long-lived token on a successful exchange", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ access_token: "long-token", token_type: "bearer", expires_in: 5_184_000 }),
          { status: 200 }
        )
      )
    );

    await expect(
      exchangeMetaLongLivedToken({
        host: "graph.instagram.com",
        grantType: "ig_exchange_token",
        appSecret: "secret",
        shortLived: { access_token: "short-token", user_id: 42 },
        timeoutMs: 5_000,
        label: "instagram",
      })
    ).resolves.toEqual({ access_token: "long-token", user_id: 42, expires_in: 5_184_000 });
  });

  it("falls back to the short-lived token on a non-ok response", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 400 })));

    await expect(
      exchangeMetaLongLivedToken({
        host: "graph.threads.net",
        grantType: "th_exchange_token",
        appSecret: "secret",
        shortLived: { access_token: "short-token", user_id: 7 },
        timeoutMs: 650,
        label: "threads",
      })
    ).resolves.toEqual({ access_token: "short-token", user_id: 7, expires_in: 3600 });
  });

  it("falls back to the short-lived token on a timeout, without swallowing other errors", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    const timeoutError = new Error("Request timed out after 650ms");
    timeoutError.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    await expect(
      exchangeMetaLongLivedToken({
        host: "graph.threads.net",
        grantType: "th_exchange_token",
        appSecret: "secret",
        shortLived: { access_token: "short-token", user_id: 7 },
        timeoutMs: 650,
        label: "threads",
      })
    ).resolves.toEqual({ access_token: "short-token", user_id: 7, expires_in: 3600 });

    const networkError = new Error("getaddrinfo ENOTFOUND");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(
      exchangeMetaLongLivedToken({
        host: "graph.threads.net",
        grantType: "th_exchange_token",
        appSecret: "secret",
        shortLived: { access_token: "short-token", user_id: 7 },
        timeoutMs: 650,
        label: "threads",
      })
    ).rejects.toBe(networkError);
  });
});
