import type { Viewport } from "next";

// Marketing pages render a hardcoded dark palette (bg-slate-950) instead of the
// CSS-variable theme, so the browser isn't told the page is dark — no native
// dark scrollbars/controls, white flash before hydration. Task #245.
// Dashboard/auth stay on the default (light) viewport — see Task #246.
export const MARKETING_VIEWPORT: Viewport = {
  colorScheme: "dark",
  themeColor: "#020617",
};
