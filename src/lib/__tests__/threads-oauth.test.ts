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
      startActiveSpan: (_name: string, callback: (span: typeof mockSpan) => unknown) =>
        callback(mockSpan),
    }),
  },
  SpanStatusCode: { ERROR: 2 },
}));

async function loadThreadsOAuth() {
  vi.resetModules();
  vi.stubEnv("THREADS_APP_ID", "threads-app-id");
  vi.stubEnv("THREADS_APP_SECRET", "threads-app-secret");
  vi.stubEnv("BETTER_AUTH_URL", "https://scopegate.example");
  return import("../threads-oauth");
}

describe("exchangeThreadsCodeForTokens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockSpan.setAttribute.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.end.mockClear();
  });

  it("uses explicit timeouts for both Threads token requests", async () => {
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
    await expect(exchangeThreadsCodeForTokens("oauth-code")).resolves.toEqual({
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
    expect(mockSpan.setAttribute).toHaveBeenCalledWith(
      "url.path",
      "/oauth/access_token"
    );
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("url.path", "/access_token");
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
    await expect(exchangeThreadsCodeForTokens("oauth-code")).resolves.toEqual({
      access_token: "short-token",
      user_id: 123,
      expires_in: 3600,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[ScopeGate] Threads token request timed out",
      { path: "/access_token", timeoutMs: 650 }
    );
    expect(mockSpan.recordException).toHaveBeenCalledWith(timeoutError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "Request timed out after 650ms",
    });
  });
});
