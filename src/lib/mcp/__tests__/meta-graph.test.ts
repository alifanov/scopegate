import { describe, expect, it, vi } from "vitest";
import { serviceFetch } from "@/lib/mcp/service-fetch";
import { OAuthTokenError } from "@/lib/oauth-token-lifecycle";

const span = { setAttribute: vi.fn() };

vi.mock("@opentelemetry/api", () => ({
  SpanKind: { CLIENT: 2 },
  SpanStatusCode: { ERROR: 2 },
  trace: {
    getActiveSpan: vi.fn(() => span),
    getTracer: vi.fn(() => ({
      startActiveSpan: vi.fn((_name: string, _options: unknown, fn: (s: unknown) => unknown) =>
        fn(span)
      ),
    })),
  },
}));

vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

import { MetaGraphApiError, metaGraphFetch } from "../meta-graph";

const errorResponse = (code: number, status = 400) =>
  new Response(JSON.stringify({ error: { code, message: "boom" } }), { status });

describe.each([
  { providerKey: "threads", label: "Threads" },
  { providerKey: "instagram", label: "Instagram" },
  { providerKey: "metaAds", label: "Meta Ads" },
])("metaGraphFetch ($providerKey)", ({ providerKey, label }) => {
  it("maps dead-token codes 190/102 to OAuthTokenError", async () => {
    for (const code of [190, 102]) {
      vi.mocked(serviceFetch).mockResolvedValueOnce(errorResponse(code));
      await expect(
        metaGraphFetch(providerKey, label, "conn-1", "/path")
      ).rejects.toThrow(OAuthTokenError);
    }
  });

  it("marks 5xx and code 1/2 as transient MetaGraphApiError", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(errorResponse(1, 500));
    const err1 = await metaGraphFetch(providerKey, label, "conn-1", "/path").catch((e) => e);
    expect(err1).toBeInstanceOf(MetaGraphApiError);
    expect((err1 as InstanceType<typeof MetaGraphApiError>).isTransient).toBe(true);

    vi.mocked(serviceFetch).mockResolvedValueOnce(errorResponse(2, 503));
    const err2 = await metaGraphFetch(providerKey, label, "conn-1", "/path").catch((e) => e);
    expect((err2 as InstanceType<typeof MetaGraphApiError>).isTransient).toBe(true);
  });

  it("marks other 4xx codes as non-transient", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(errorResponse(100, 400));
    const err = await metaGraphFetch(providerKey, label, "conn-1", "/path").catch((e) => e);
    expect(err).toBeInstanceOf(MetaGraphApiError);
    expect((err as InstanceType<typeof MetaGraphApiError>).isTransient).toBe(false);
  });

  it("returns parsed JSON on success", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    await expect(metaGraphFetch(providerKey, label, "conn-1", "/path")).resolves.toEqual({
      ok: true,
    });
  });
});
