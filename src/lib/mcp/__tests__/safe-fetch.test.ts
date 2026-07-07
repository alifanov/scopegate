import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IncomingMessage } from "node:http";
import type { RequestOptions } from "node:https";

// Mock dns/promises before importing safe-fetch
vi.mock("dns/promises", () => ({
  lookup: vi.fn(),
}));

// Mock node:https before importing safe-fetch
vi.mock("node:https", () => ({
  default: {
    request: vi.fn(),
  },
}));

const mockActiveSpan = {
  setAttribute: vi.fn(),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getActiveSpan: vi.fn(() => mockActiveSpan),
  },
}));

import { lookup } from "dns/promises";
import https from "node:https";
import { safeFetch } from "../safe-fetch";

const mockLookup = vi.mocked(lookup);
const mockHttpsRequest = vi.mocked(https.request);

// Returns an array — matches dns.lookup({ all: true }) return type
function mockDns(...addresses: Array<{ address: string; family: number }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockLookup.mockResolvedValue(addresses as any);
}

type MockRes = {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
  on: ReturnType<typeof vi.fn>;
};

// Builds a minimal ClientRequest-like mock and registers a one-shot https response
function mockHttpsResponse(
  status: number,
  headers: Record<string, string | string[]> = {}
) {
  const mockRes: MockRes = {
    statusCode: status,
    statusMessage: "OK",
    headers,
    on: vi.fn().mockReturnThis(),
  };

  const mockReq = {
    on: vi.fn().mockReturnThis(),
    write: vi.fn(),
    end: vi.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockHttpsRequest as any).mockImplementationOnce(
    (_opts: RequestOptions, callback?: (res: IncomingMessage) => void) => {
      if (callback) callback(mockRes as unknown as IncomingMessage);
      return mockReq;
    }
  );

  return mockReq;
}

describe("safeFetch – SSRF protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scheme enforcement", () => {
    it("blocks http: scheme", async () => {
      await expect(safeFetch("http://example.com/img.jpg")).rejects.toThrow(
        "only https: scheme is allowed"
      );
    });

    it("blocks ftp: scheme", async () => {
      await expect(safeFetch("ftp://example.com/file")).rejects.toThrow(
        "only https: scheme is allowed"
      );
    });

    it("rejects invalid URLs", async () => {
      await expect(safeFetch("not-a-url")).rejects.toThrow(
        "SSRF protection: invalid URL"
      );
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
      mockDns({ address: "127.0.0.1", family: 4 });
      await expect(safeFetch("https://localhost/secret")).rejects.toThrow(
        "resolves to reserved IP"
      );
    });

    it("blocks hostname that resolves to 169.254.169.254 (internal alias)", async () => {
      mockDns({ address: "169.254.169.254", family: 4 });
      await expect(
        safeFetch("https://metadata.internal/latest/meta-data/")
      ).rejects.toThrow("resolves to reserved IP");
    });

    it("blocks hostname that resolves to 10.0.0.1 (private network)", async () => {
      mockDns({ address: "10.0.0.1", family: 4 });
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
      mockDns({ address: "93.184.216.34", family: 4 }); // example.com
      mockHttpsResponse(200);
      await expect(safeFetch("https://example.com/img.jpg")).resolves.toBeDefined();
    });

    it("blocks when ANY record in multi-A response resolves to a private IP", async () => {
      // Domain with both public and private A records — was undetected before all:true fix
      mockDns(
        { address: "93.184.216.34", family: 4 }, // public — single-record check would pass this
        { address: "169.254.169.254", family: 4 } // private — must block the whole request
      );
      await expect(
        safeFetch("https://dual-record.example.com/img")
      ).rejects.toThrow("resolves to reserved IP");
    });
  });

  describe("DNS rebinding prevention", () => {
    it("resolves DNS exactly once — no second lookup on actual connection", async () => {
      // Simulates a DNS rebinding scenario: attacker controls DNS and would return
      // a private IP on the second resolution. Our implementation pins to the first
      // validated IP so there is no second lookup.
      mockDns({ address: "93.184.216.34", family: 4 }); // first (and only) lookup: public
      mockHttpsResponse(200);

      const res = await safeFetch("https://example.com/img.jpg");
      expect(res.status).toBe(200);

      // DNS resolved exactly once — no re-resolution window for rebinding
      expect(mockLookup).toHaveBeenCalledTimes(1);
      expect(mockLookup).toHaveBeenCalledWith("example.com", { all: true });
    });
  });

  describe("redirect safety", () => {
    it("blocks redirect from public URL to private IP", async () => {
      mockDns({ address: "93.184.216.34", family: 4 }); // for example.com
      mockHttpsResponse(301, {
        location: "https://169.254.169.254/latest/meta-data/",
      });
      await expect(safeFetch("https://example.com/img")).rejects.toThrow(
        "reserved range"
      );
    });

    it("blocks after too many redirects", async () => {
      // Each hop: DNS resolves to public IP, then returns 301 to itself
      for (let i = 0; i <= 6; i++) {
        mockDns({ address: "93.184.216.34", family: 4 });
        mockHttpsResponse(301, { location: "https://example.com/next" });
      }
      await expect(safeFetch("https://example.com/start")).rejects.toThrow(
        "too many redirects"
      );
    });

    it("throws when redirect has no Location header", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });
      mockHttpsResponse(301);
      await expect(safeFetch("https://example.com/img")).rejects.toThrow(
        "missing Location header"
      );
    });
  });

  describe("timeout", () => {
    it("destroys the request and rejects with a timeout error", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });

      const mockReq = {
        on: vi.fn().mockReturnThis(),
        write: vi.fn(),
        end: vi.fn(),
        setTimeout: vi.fn(),
        destroy: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockHttpsRequest as any).mockImplementationOnce(() => mockReq);

      const fetchPromise = safeFetch("https://example.com/api", { timeout: 100 });

      // Wait for makeRequest to be called (after DNS resolution microtasks)
      await vi.waitFor(() => expect(mockReq.setTimeout).toHaveBeenCalledWith(100, expect.any(Function)));

      // Simulate the timeout firing
      const timeoutCb = mockReq.setTimeout.mock.calls[0][1] as () => void;
      timeoutCb();

      expect(mockReq.destroy).toHaveBeenCalledWith(expect.any(Error));
      const destroyErr = mockReq.destroy.mock.calls[0][0] as Error;
      expect(destroyErr.message).toContain("timed out after 100ms");
      expect(destroyErr.name).toBe("TimeoutError");

      // Propagate the error through the "error" event listener
      const errorHandler = mockReq.on.mock.calls.find((c: unknown[]) => c[0] === "error");
      (errorHandler![1] as (e: Error) => void)(destroyErr);

      await expect(fetchPromise).rejects.toThrow("timed out after 100ms");
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith(
        "error.message",
        "Request timed out after 100ms"
      );
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith(
        "error.name",
        "TimeoutError"
      );
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith(
        "error.type",
        "TimeoutError"
      );
    });

    it("does not call req.setTimeout when timeout option is absent", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });

      const mockReq = {
        on: vi.fn().mockReturnThis(),
        write: vi.fn(),
        end: vi.fn(),
        setTimeout: vi.fn(),
        destroy: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockHttpsRequest as any).mockImplementationOnce(
        (_opts: unknown, cb?: (res: unknown) => void) => {
          if (cb) {
            const mockRes = {
              statusCode: 200,
              statusMessage: "OK",
              headers: {},
              on: vi.fn().mockReturnThis(),
            };
            cb(mockRes);
          }
          return mockReq;
        }
      );

      await safeFetch("https://example.com/api");
      expect(mockReq.setTimeout).not.toHaveBeenCalled();
    });
  });

  describe("successful requests", () => {
    it("annotates connection errors on the active telemetry span", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });

      const mockReq = {
        on: vi.fn().mockReturnThis(),
        write: vi.fn(),
        end: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockHttpsRequest as any).mockImplementationOnce(() => mockReq);

      const fetchPromise = safeFetch("https://example.com/api");
      await vi.waitFor(() => expect(mockReq.on).toHaveBeenCalledWith("error", expect.any(Function)));

      const err = new Error("socket hang up") as NodeJS.ErrnoException;
      err.code = "ECONNRESET";
      const errorHandler = mockReq.on.mock.calls.find((c: unknown[]) => c[0] === "error");
      (errorHandler![1] as (e: Error) => void)(err);

      await expect(fetchPromise).rejects.toThrow("socket hang up");
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith(
        "error.message",
        "socket hang up"
      );
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith("error.name", "Error");
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith("error.type", "ECONNRESET");
      expect(mockActiveSpan.setAttribute).toHaveBeenCalledWith("error.code", "ECONNRESET");
    });

    it("returns response with correct status", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });
      mockHttpsResponse(200, { "content-type": "image/jpeg" });
      const res = await safeFetch("https://example.com/photo.jpg");
      expect(res.status).toBe(200);
    });

    it("passes method and hostname to https.request", async () => {
      mockDns({ address: "93.184.216.34", family: 4 });
      mockHttpsResponse(200);
      await safeFetch("https://example.com/api", { method: "POST" });
      expect(mockHttpsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          hostname: "example.com",
        }),
        expect.any(Function)
      );
    });
  });

  describe("pinned DNS lookup honors autoSelectFamily (Happy Eyeballs)", () => {
    // Node 20+ defaults autoSelectFamily=true, calling the custom lookup with
    // { all: true } and expecting an ARRAY of { address, family }. Returning the
    // legacy (address, family) form there throws "Invalid IP address: undefined".
    async function captureLookup() {
      mockDns({ address: "93.184.216.34", family: 4 });
      mockHttpsResponse(200);
      await safeFetch("https://example.com/api");
      const opts = (mockHttpsRequest as unknown as { mock: { calls: unknown[][] } })
        .mock.calls[0][0] as { lookup: (...a: unknown[]) => void };
      return opts.lookup;
    }

    it("returns an array of records when opts.all is true", async () => {
      const lookupFn = await captureLookup();
      const cb = vi.fn();
      lookupFn("example.com", { all: true }, cb);
      expect(cb).toHaveBeenCalledWith(null, [
        { address: "93.184.216.34", family: 4 },
      ]);
    });

    it("returns the legacy (address, family) form when opts.all is falsy", async () => {
      const lookupFn = await captureLookup();
      const cb = vi.fn();
      lookupFn("example.com", {}, cb);
      expect(cb).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    });
  });
});
