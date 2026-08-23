import { afterEach, describe, expect, it } from "vitest";
import {
  generateMcpApiKey,
  getClientIp,
  getInvalidMcpApiKeyBucketCountForTest,
  isInvalidMcpApiKeyRateLimited,
  resetInvalidMcpApiKeyRateLimitsForTest,
} from "@/lib/mcp/api-keys";

describe("MCP API keys", () => {
  it("generates prefixed CSPRNG keys with at least 128 bits of entropy", () => {
    const key = generateMcpApiKey();

    expect(key).toMatch(/^sg_[A-Za-z0-9_-]+$/);
    expect(key.length).toBeGreaterThanOrEqual(25);
  });

  it("does not generate duplicate keys in a small sample", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateMcpApiKey()));

    expect(keys.size).toBe(100);
  });
});

describe("getClientIp", () => {
  it("trusts x-real-ip over x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9" },
    });

    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("takes the last hop of x-forwarded-for, not the client-supplied first hop", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.1.1.1, 203.0.113.7" },
    });

    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to cf-connecting-ip, then unknown", () => {
    const withCf = new Request("https://example.com", {
      headers: { "cf-connecting-ip": "198.51.100.1" },
    });
    expect(getClientIp(withCf)).toBe("198.51.100.1");

    const bare = new Request("https://example.com");
    expect(getClientIp(bare)).toBe("unknown");
  });
});

describe("isInvalidMcpApiKeyRateLimited", () => {
  afterEach(() => {
    resetInvalidMcpApiKeyRateLimitsForTest();
  });

  it(
    "caps memory usage when flooded with unique IPs",
    () => {
      const now = Date.now();
      for (let i = 0; i < 200_000; i++) {
        isInvalidMcpApiKeyRateLimited(`10.0.${Math.floor(i / 65536)}.${i % 65536}`, now);
      }

      expect(getInvalidMcpApiKeyBucketCountForTest()).toBeLessThanOrEqual(20_000);
    },
    15_000
  );

  it("expires stale buckets instead of keeping them forever", () => {
    const start = Date.now();
    for (let i = 0; i < 40; i++) {
      isInvalidMcpApiKeyRateLimited("1.2.3.4", start);
    }
    expect(isInvalidMcpApiKeyRateLimited("1.2.3.4", start)).toBe(true);

    // window has passed: bucket resets instead of staying blocked forever
    expect(isInvalidMcpApiKeyRateLimited("1.2.3.4", start + 60_001)).toBe(false);
  });
});
