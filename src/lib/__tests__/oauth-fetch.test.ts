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

async function loadOAuthFetch() {
  vi.resetModules();
  return import("../oauth-fetch");
}

describe("oauthFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSpan.setAttribute.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.end.mockClear();
    startActiveSpanMock.mockClear();
  });

  it("applies the default timeout when the caller and the provider registry give none", async () => {
    const signal = new AbortController().signal;
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { oauthFetch } = await loadOAuthFetch();
    await oauthFetch("https://example.com/token", {}, { label: "unknown-provider" });

    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ signal }));
  });

  it("honors an explicit timeoutMs over the default", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    const { oauthFetch } = await loadOAuthFetch();
    await oauthFetch("https://example.com/token", {}, { timeoutMs: 1_500, label: "slack" });

    expect(timeoutSpy).toHaveBeenCalledWith(1_500);
  });

  it("marks the span as errored on a non-ok response but still returns it to the caller", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 401 })));

    const { oauthFetch } = await loadOAuthFetch();
    const res = await oauthFetch("https://example.com/token", {}, { label: "github" });

    expect(res.status).toBe(401);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith("http.status_code", 401);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: "HTTP 401" });
    expect(mockSpan.end).toHaveBeenCalled();
  });

  it("propagates a non-timeout network error after recording it on the span", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(new AbortController().signal);
    const networkError = new Error("getaddrinfo ENOTFOUND");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    const { oauthFetch } = await loadOAuthFetch();
    await expect(oauthFetch("https://example.com/token", {}, { label: "hubspot" })).rejects.toBe(
      networkError
    );

    expect(mockSpan.recordException).toHaveBeenCalledWith(networkError);
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "getaddrinfo ENOTFOUND",
    });
    expect(mockSpan.end).toHaveBeenCalled();
  });
});
