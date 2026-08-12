import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSpan = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

const startActiveSpanMock = vi.fn(
  (_name: string, _options: unknown, callback: (span: typeof mockSpan) => unknown) =>
    callback(mockSpan)
);

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: () => ({ startActiveSpan: startActiveSpanMock }),
  },
  SpanKind: { CLIENT: 2 },
  SpanStatusCode: { ERROR: 2 },
}));

async function loadThreadsOAuth() {
  vi.resetModules();
  vi.stubEnv("THREADS_APP_ID", "threads-app-id");
  vi.stubEnv("THREADS_APP_SECRET", "threads-app-secret");
  vi.stubEnv("BETTER_AUTH_URL", "https://scopegate.example");
  return import("../threads-oauth");
}

// The app credentials the resolver would have produced from these env vars.
const THREADS_APP = {
  clientId: "threads-app-id",
  clientSecret: "threads-app-secret",
};

describe("exchangeThreadsCodeForTokens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockSpan.setAttribute.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.end.mockClear();
    startActiveSpanMock.mockClear();
  });

  it("uses explicit timeouts for both Threads token requests, routed through oauthFetch", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "short-token", user_id: 123 }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "long-token",
            token_type: "bearer",
            expires_in: 5_184_000,
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const { exchangeThreadsCodeForTokens } = await loadThreadsOAuth();
    await expect(exchangeThreadsCodeForTokens("oauth-code", THREADS_APP)).resolves.toEqual({
      access_token: "long-token",
      user_id: 123,
      expires_in: 5_184_000,
    });

    expect(timeoutSpy).toHaveBeenNthCalledWith(1, 5_000);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, 650);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ signal, method: "POST" })
    );
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ signal }));

    // Both hops go through oauth-fetch.ts's shared CLIENT span, tagged with the
    // "threads" provider and their own url.path — set at span-creation time.
    expect(startActiveSpanMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        attributes: expect.objectContaining({
          "mcp.provider": "threads",
          "url.path": "/oauth/access_token",
        }),
      })
    );
    expect(startActiveSpanMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        attributes: expect.objectContaining({
          "mcp.provider": "threads",
          "url.path": "/access_token",
        }),
      })
    );
  });

  it("logs a slow long-lived exchange and falls back to the short-lived token", async () => {
    const timeoutError = new Error("Request timed out after 650ms");
    timeoutError.name = "TimeoutError";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: "short-token", user_id: 123 }), {
            status: 200,
          })
        )
        .mockRejectedValueOnce(timeoutError)
    );

    const { exchangeThreadsCodeForTokens } = await loadThreadsOAuth();
    await expect(exchangeThreadsCodeForTokens("oauth-code", THREADS_APP)).resolves.toEqual({
      access_token: "short-token",
      user_id: 123,
      expires_in: 3600,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[ScopeGate] graph.threads.net long-lived token exchange timed out",
      { timeoutMs: 650 }
    );
    expect(mockSpan.recordException).toHaveBeenCalledWith(timeoutError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "Request timed out after 650ms",
    });
  });
});
