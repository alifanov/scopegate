import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getValidAccessTokenForConnection } from "@/lib/oauth-token-lifecycle";
import { safeFetch } from "@/lib/mcp/safe-fetch";
import { serviceFetch, serviceJsonFetch } from "@/lib/mcp/service-fetch";

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
      findUnique: vi.fn(),
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

describe("serviceFetch path traversal protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getValidAccessTokenForConnection).mockResolvedValue("token-1");
  });

  it("rejects a notion page_id param that escapes /pages into /users", async () => {
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "notion",
    } as never);

    await expect(serviceFetch("conn-1", "/pages/../users")).rejects.toThrow(
      "path traversal segment"
    );
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it("rejects a salesforce objectType param that escapes sobjects into an arbitrary SOQL query endpoint", async () => {
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "salesforce",
      metadata: { salesforceInstanceUrl: "https://my-org.my.salesforce.com" },
    } as never);

    await expect(
      serviceFetch(
        "conn-1",
        "/services/data/v59.0/sobjects/../../../../services/data/v59.0/query?q=SELECT+Id+FROM+Account"
      )
    ).rejects.toThrow("path traversal segment");
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it("rejects a github owner/repo param that escapes /repos into another endpoint", async () => {
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "github",
    } as never);

    await expect(serviceFetch("conn-1", "/repos/../user/emails")).rejects.toThrow(
      "path traversal segment"
    );
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it("rejects a path escaping the provider's base path prefix even without a literal '..' surviving normalization", async () => {
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "notion",
    } as never);

    await expect(serviceFetch("conn-1", "/../v2/secrets")).rejects.toThrow();
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it("still allows a well-formed path for the same provider", async () => {
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "notion",
    } as never);
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const res = await serviceFetch("conn-1", "/pages/abc123");
    expect(res.status).toBe(200);
  });
});

describe("serviceJsonFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.serviceConnection.findUniqueOrThrow).mockResolvedValue({
      id: "conn-1",
      provider: "linkedin",
    } as never);
    vi.mocked(getValidAccessTokenForConnection).mockResolvedValue("token-1");
  });

  it("resolves the error label from the connection's provider via PROVIDER_REGISTRY.displayName", async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response("{}", { status: 403 }));
    vi.mocked(db.serviceConnection.findUnique).mockResolvedValue({ provider: "linkedin" } as never);

    await expect(serviceJsonFetch("conn-1", "/posts")).rejects.toThrow("LinkedIn API request failed");
  });

  it("does not look up the provider on success", async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await serviceJsonFetch("conn-1", "/posts");

    expect(result).toEqual({ ok: true });
    expect(db.serviceConnection.findUnique).not.toHaveBeenCalled();
  });
});
