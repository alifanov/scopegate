import { describe, expect, it } from "vitest";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";

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
