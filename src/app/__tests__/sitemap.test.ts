import { describe, it, expect } from "vitest";
import sitemap from "../sitemap";
import { comparisons } from "@/data/comparisons";
import { integrations } from "@/data/integrations-seo";
import { glossaryEntries } from "@/data/glossary";
import { blogPosts } from "@/data/blog";

describe("sitemap.xml", () => {
  const entries = sitemap();

  it("includes all static pages", () => {
    const urls = entries.map((e) => e.url);
    for (const path of [
      "https://scopegate.dev",
      "https://scopegate.dev/features",
      "https://scopegate.dev/pricing",
      "https://scopegate.dev/docs",
    ]) {
      expect(urls).toContain(path);
    }
  });

  it("includes all dynamic comparison, integration, glossary, and blog pages", () => {
    const urls = new Set(entries.map((e) => e.url));
    for (const c of comparisons) {
      expect(urls.has(`https://scopegate.dev/compare/${c.slug}`)).toBe(true);
    }
    for (const i of integrations) {
      expect(urls.has(`https://scopegate.dev/integrations/${i.slug}`)).toBe(true);
    }
    for (const g of glossaryEntries) {
      expect(urls.has(`https://scopegate.dev/glossary/${g.slug}`)).toBe(true);
    }
    for (const p of blogPosts) {
      expect(urls.has(`https://scopegate.dev/blog/${p.slug}`)).toBe(true);
    }
  });

  it("every entry has a valid URL", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\/scopegate\.dev/);
    }
  });

  // Google reads lastmod and ignores changefreq/priority — and only trusts
  // lastmod while it's "consistently and verifiably accurate". These three
  // guard the sitemap against sliding back to `new Date()`, which dated all 37
  // URLs with the deploy timestamp.
  it("emits no changefreq or priority, which Google ignores", () => {
    for (const entry of entries) {
      expect(entry).not.toHaveProperty("changeFrequency");
      expect(entry).not.toHaveProperty("priority");
    }
  });

  it("never dates a URL from the build or render time", () => {
    const oneHourAgo = Date.now() - 3_600_000;
    for (const entry of entries) {
      expect(entry.lastModified).toBeDefined();
      const ts = new Date(entry.lastModified!).getTime();
      expect(ts, `${entry.url} is dated at build time`).toBeLessThan(oneHourAgo);
    }
  });

  it("has more than one distinct date across the site", () => {
    const dates = new Set(
      entries.map((e) => new Date(e.lastModified!).toISOString().slice(0, 10)),
    );
    expect(dates.size).toBeGreaterThan(1);
  });

  it("has no duplicate URLs", () => {
    const urls = entries.map((e) => e.url);
    const duplicates = urls.filter((u, i) => urls.indexOf(u) !== i);
    expect(duplicates).toEqual([]);
  });
});
