import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";

// globals.css paints the canvas (overscroll / pre-hydration) by matching the
// theme-color meta MARKETING_VIEWPORT emits. The hex lives in both files, so
// guard against drift. Task #245.
describe("marketing viewport", () => {
  it("keeps the canvas rule in globals.css in sync with the theme color", () => {
    const themeColor = MARKETING_VIEWPORT.themeColor;
    expect(themeColor).toBe("#020617");

    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    expect(css).toContain(
      `html:has(meta[name="theme-color"][content="${themeColor}"])`,
    );
    expect(css).toContain(`background-color: ${themeColor};`);
  });
});
