import type { Metadata } from "next";

// Next.js does NOT deep-merge `openGraph`: a page-level object replaces the
// root one wholesale, so every page that sets its own title/url silently loses
// the image, siteName and type. Spread this into each page's openGraph instead
// of repeating them. Task #313; og-defaults.test.ts guards new pages.
export const OG_DEFAULTS = {
  siteName: "ScopeGate",
  type: "website",
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "ScopeGate — AI Access Proxy Layer",
    },
  ],
} satisfies Metadata["openGraph"];
