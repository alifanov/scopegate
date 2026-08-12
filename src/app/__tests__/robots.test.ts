import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import robots from "../robots";

describe("robots.txt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("cloud mode", () => {
    beforeEach(() => {
      vi.stubEnv("SCOPEGATE_CLOUD", "1");
    });

    it("allows crawling of the root", () => {
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const mainRule = rules.find((r) => r.userAgent === "*");
      expect(mainRule).toBeDefined();
      expect(mainRule!.allow).toBe("/");
    });

    it("disallows all sensitive routes", () => {
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const mainRule = rules.find((r) => r.userAgent === "*")!;
      const disallowed = Array.isArray(mainRule.disallow)
        ? mainRule.disallow
        : [mainRule.disallow];
      for (const route of ["/admin/", "/billing/", "/projects/", "/settings/"]) {
        expect(disallowed).toContain(route);
      }
    });

    it("points sitemap to the correct URL", () => {
      expect(robots().sitemap).toBe("https://scopegate.dev/sitemap.xml");
    });
  });

  describe("self-hosted mode", () => {
    beforeEach(() => {
      vi.stubEnv("SCOPEGATE_CLOUD", "");
    });

    // Every self-hosted deployment ships the same marketing pages. Letting them
    // be indexed would put dozens of copies of the cloud site's content on the
    // open web under other people's domains.
    it("disallows the whole site and advertises no sitemap", () => {
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const mainRule = rules.find((r) => r.userAgent === "*")!;
      expect(mainRule.disallow).toBe("/");
      expect(mainRule.allow).toBeUndefined();
      expect(result.sitemap).toBeUndefined();
    });
  });
});
