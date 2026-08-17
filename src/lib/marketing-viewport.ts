import type { Viewport } from "next";

// Marketing pages render a hardcoded dark palette (bg-slate-950) instead of the
// CSS-variable theme, so the browser isn't told the page is dark — no native
// dark scrollbars/controls, white flash before hydration. Task #245.
// Dashboard stays on the default (light) viewport.
export const MARKETING_VIEWPORT: Viewport = {
  colorScheme: "dark",
  themeColor: "#020617",
};

// (auth) routes + /magic-link render the shadcn `.dark` theme (--background),
// not the marketing pages' hardcoded slate-950 — different hex, same intent.
// Task #246: dark bridge between the dark landing and the login form.
export const AUTH_VIEWPORT: Viewport = {
  colorScheme: "dark",
  themeColor: "#0d0b12",
};
