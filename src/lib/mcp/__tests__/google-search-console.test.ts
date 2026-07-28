import { describe, expect, it, vi } from "vitest";
import { serviceFetch } from "@/lib/mcp/service-fetch";

vi.mock("@opentelemetry/api", () => ({
  metrics: {
    getMeter: vi.fn(() => ({
      createHistogram: vi.fn(() => ({ record: vi.fn() })),
    })),
  },
}));

vi.mock("@/lib/mcp/service-fetch", () => ({
  serviceFetch: vi.fn(),
}));

import { googleSearchConsoleFetch } from "../google-search-console";

describe("googleSearchConsoleFetch", () => {
  it("includes the API error reason in the thrown message", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: "User does not have sufficient permission", status: "PERMISSION_DENIED" } }),
        { status: 403 }
      )
    );
    await expect(googleSearchConsoleFetch("conn-1", "/sites")).rejects.toThrow(
      "Google Search Console API request failed (403) — User does not have sufficient permission (PERMISSION_DENIED)"
    );
  });

  it("falls back to a generic message when the body isn't JSON", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(new Response("not json", { status: 500 }));
    await expect(googleSearchConsoleFetch("conn-1", "/sites")).rejects.toThrow(
      "Google Search Console API request failed (500)"
    );
  });

  it("returns parsed JSON on success", async () => {
    vi.mocked(serviceFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    await expect(googleSearchConsoleFetch("conn-1", "/sites")).resolves.toEqual({ ok: true });
  });
});
