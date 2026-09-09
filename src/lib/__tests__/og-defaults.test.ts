import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OG_DEFAULTS } from "@/lib/og";

// Next.js replaces (not merges) a page-level `openGraph`, so any page that
// declares one must spread OG_DEFAULTS back in or it ships without an image.
// Task #313.
describe("og defaults", () => {
  it("points at an image that exists", () => {
    expect(
      existsSync(path.join(process.cwd(), "public", OG_DEFAULTS.images[0].url)),
    ).toBe(true);
  });

  it("is spread into every openGraph block under src/app", () => {
    const appDir = path.join(process.cwd(), "src/app");
    const offenders = readdirSync(appDir, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => {
        const src = readFileSync(path.join(appDir, file), "utf8");
        return src.includes("openGraph: {") && !src.includes("...OG_DEFAULTS");
      });
    expect(offenders).toEqual([]);
  });
});
