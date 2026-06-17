import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  // Reporting endpoint group referenced by `report-to` in the Report-Only CSP below.
  {
    key: "Reporting-Endpoints",
    value: 'csp-endpoint="/api/csp-report"',
  },
  // Baseline policy in Report-Only mode: it never blocks, only reports violations
  // to /api/csp-report so we can observe what a real enforced policy would break.
  // Tailored to what ScopeGate actually loads:
  //   - script/style: 'self' + 'unsafe-inline' (Next.js injects inline bootstrap
  //     scripts and Tailwind / styled inline styles).
  //   - fonts: next/font/google self-hosts the Geist fonts under /_next, so 'self'
  //     (plus data: for inlined glyphs) is sufficient — no external font domain.
  //   - img: 'self' for /logo.png etc., plus data:/blob: for inlined images.
  //   - connect: 'self' — the app has no external client-side fetch targets.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "report-uri /api/csp-report",
      "report-to csp-endpoint",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
