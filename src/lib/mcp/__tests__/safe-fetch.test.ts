import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dns/promises before importing safe-fetch
vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "dns/promises";
import { safeFetch } from "../safe-fetch";

const mockLookup = vi.mocked(lookup);

function mockDns(address: string) {
  mockLookup.mockResolvedValue({ address, family: 4 } as Awaited<ReturnType<typeof lookup>>);
}

function mockFetchResponse(status: number, headers: Record<string, string> = {}) {
  const responseHeaders = new Headers(headers);
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status, headers: responseHeaders })
  );
}

describe("safeFetch – SSRF protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scheme enforcement", () => {
    it("blocks http: scheme", async () => {
      await expect(safeFetch("http://example.com/img.jpg")).rejects.toThrow(
        'only https: scheme is allowed'
      );
    });

    it("blocks ftp: scheme", async () => {
      await expect(safeFetch("ftp://example.com/file")).rejects.toThrow(
        'only https: scheme is allowed'
      );
    });

    it("rejects invalid URLs", async () => {
      await expect(safeFetch("not-a-url")).rejects.toThrow("SSRF protection: invalid URL");
    });
  });

  describe("direct private IP blocking (no DNS)", () => {
    it("blocks loopback 127.0.0.1", async () => {
      await expect(safeFetch("https://127.0.0.1/secret")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks AWS metadata endpoint 169.254.169.254", async () => {
      await expect(
        safeFetch("https://169.254.169.254/latest/meta-data/")
      ).rejects.toThrow("reserved range");
    });

    it("blocks RFC-1918 10.x.x.x", async () => {
      await expect(safeFetch("https://10.0.0.1/internal")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks RFC-1918 172.16.x.x", async () => {
      await expect(safeFetch("https://172.16.0.1/internal")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks RFC-1918 192.168.x.x", async () => {
      await expect(safeFetch("https://192.168.1.1/internal")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks IPv6 loopback ::1", async () => {
      await expect(safeFetch("https://[::1]/secret")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks IPv6 link-local fe80::1", async () => {
      await expect(safeFetch("https://[fe80::1]/secret")).rejects.toThrow(
        "reserved range"
      );
    });
  });

  describe("DNS-based SSRF blocking", () => {
    it("blocks hostname that resolves to 127.0.0.1 (localhost)", async () => {
      mockDns("127.0.0.1");
      await expect(safeFetch("https://localhost/secret")).rejects.toThrow(
        "resolves to reserved IP"
      );
    });

    it("blocks hostname that resolves to 169.254.169.254 (internal alias)", async () => {
      mockDns("169.254.169.254");
      await expect(
        safeFetch("https://metadata.internal/latest/meta-data/")
      ).rejects.toThrow("resolves to reserved IP");
    });

    it("blocks hostname that resolves to 10.0.0.1 (private network)", async () => {
      mockDns("10.0.0.1");
      await expect(safeFetch("https://internal.corp/api")).rejects.toThrow(
        "resolves to reserved IP"
      );
    });

    it("throws SSRF error when DNS resolution fails", async () => {
      mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
      await expect(safeFetch("https://nonexistent.invalid/")).rejects.toThrow(
        "DNS resolution failed"
      );
    });

    it("allows hostname that resolves to a public IP", async () => {
      mockDns("93.184.216.34"); // example.com
      const spy = mockFetchResponse(200);
      await expect(safeFetch("https://example.com/img.jpg")).resolves.toBeDefined();
      spy.mockRestore();
    });
  });

  describe("redirect safety", () => {
    it("blocks redirect from public URL to private IP", async () => {
      mockDns("93.184.216.34"); // first call for example.com
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, {
          status: 301,
          headers: { location: "https://169.254.169.254/latest/meta-data/" },
        })
      );
      await expect(safeFetch("https://example.com/img")).rejects.toThrow(
        "reserved range"
      );
      spy.mockRestore();
    });

    it("blocks after too many redirects", async () => {
      mockDns("93.184.216.34");
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, {
          status: 301,
          headers: { location: "https://example.com/next" },
        })
      );
      await expect(safeFetch("https://example.com/start")).rejects.toThrow(
        "too many redirects"
      );
      spy.mockRestore();
    });

    it("throws when redirect has no Location header", async () => {
      mockDns("93.184.216.34");
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, { status: 301 })
      );
      await expect(safeFetch("https://example.com/img")).rejects.toThrow(
        "missing Location header"
      );
      spy.mockRestore();
    });
  });

  describe("successful requests", () => {
    it("returns response for valid https URL", async () => {
      mockDns("93.184.216.34");
      const spy = mockFetchResponse(200, { "content-type": "image/jpeg" });
      const res = await safeFetch("https://example.com/photo.jpg");
      expect(res.status).toBe(200);
      spy.mockRestore();
    });

    it("passes through fetch options", async () => {
      mockDns("93.184.216.34");
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, { status: 200 })
      );
      await safeFetch("https://example.com/api", { method: "POST" });
      expect(spy).toHaveBeenCalledWith(
        "https://example.com/api",
        expect.objectContaining({ method: "POST", redirect: "manual" })
      );
      spy.mockRestore();
    });
  });
});
