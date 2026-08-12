import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Features } from "@/components/landing/features";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Per-Agent Permissions, Audit Trails & Rate Limiting",
  description:
    "Granular per-agent permission control, instant revocation, full audit trails, and rate limiting for MCP-connected AI agents.",
  alternates: { canonical: "https://scopegate.dev/features" },
};

const ALL_FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="12" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 16h4M16 14v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Per-agent, per-action granular scope control",
    description:
      "Every AI agent gets its own permission profile. Each individual action is a separate toggle and everything is off until you switch it on. Not team-level. Not org-level. Per agent.",
    bullets: [
      "List and read Drive files — never delete",
      "Send-only Gmail — agents can't read your inbox",
      "Calendar read-only per agent",
      "Instant toggle without revoking OAuth",
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 11H1M21 11h-2M11 1v2M11 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Instant cross-service revocation",
    description:
      "One click. All services. The proxy stops forwarding immediately — no waiting for OAuth tokens to expire. Perfect for incident response or when an agent behaves unexpectedly.",
    bullets: [
      "Revoke one agent or all agents at once",
      "Automated triggers via API",
      "Every revocation recorded in audit log",
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 9h18M6 13h3M12 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Full audit trail",
    description:
      "Every tool call logged: action, params, status, error, duration. Queryable, exportable, and retention-configurable. Know exactly what every agent did and when.",
    bullets: [
      "Every request logged with timestamp",
      "SOC 2 & EU AI Act ready",
      "7–365 day retention depending on plan",
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L19 6v6c0 4.418-3.582 7-8 8-4.418-1-8-3.582-8-8V6l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 11l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "5-minute developer onboarding",
    description:
      "No Kubernetes. No Entra ID. No platform team. One OAuth click, one config line, one MCP URL — and you're live. ScopeGate is designed for developers, not enterprise IT.",
    bullets: [
      "Visual toggle matrix",
      "Per-action permission toggles",
      "Auto-generated MCP endpoint",
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Rate limiting per agent",
    description:
      "Set a requests-per-minute cap on each endpoint independently. Prevent runaway agents from burning through API quotas or triggering abuse detection on third-party services.",
    bullets: [
      "Configurable per service per agent",
      "Hard caps with graceful errors",
      "Usage visible in dashboard",
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 4h14v10H4zM8 18h6M11 14v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Works with any MCP client",
    description:
      "ScopeGate exposes a standard MCP endpoint URL. Drop it into Claude Desktop, Cursor, Continue.dev, or any MCP-compatible agent framework — no custom SDK required.",
    bullets: [
      "Claude Desktop, Cursor, Continue.dev",
      "Standard MCP transport (SSE + JSON-RPC)",
      "Custom agents via any MCP client library",
    ],
  },
];

const INTEGRATIONS = [
  "Google Drive", "Gmail", "Google Calendar", "Stripe",
  "Slack", "Notion", "GitHub", "Twitter/X",
  "LinkedIn", "Google Ads", "OpenRouter",
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 text-center px-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            Features
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tight leading-tight">
            The missing permission layer
            <br />
            <span className="text-slate-500">for the MCP ecosystem</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            ScopeGate sits between your AI agents and your connected services —
            enforcing granular permissions, logging every action, and letting you
            revoke access in one click.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="inline-flex cursor-pointer items-center justify-center px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-all duration-150 shadow-lg shadow-violet-900/30"
            >
              Start free — no card needed
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights grid */}
      <Features />

      {/* All features list */}
      <section className="py-20 border-t border-slate-800/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em] mb-3">
              Everything included
            </p>
            <h2 className="text-3xl font-bold text-slate-50">
              Everything you need to govern AI agents
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900/50 rounded-2xl border border-slate-800/60 p-6 space-y-4 hover:border-slate-700/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-700/20 flex items-center justify-center text-violet-400">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
                <ul className="space-y-1.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-violet-500">
                        <path d="M2.5 7.5l3.5 3.5 5.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 border-t border-slate-800/40">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em] mb-3">
            Integrations
          </p>
          <h2 className="text-2xl font-bold text-slate-50 mb-8">
            Works with the tools your agents need
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {INTEGRATIONS.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 text-sm text-slate-400 bg-slate-900/60 border border-slate-800/60 rounded-full"
              >
                {name}
              </span>
            ))}
            <span className="px-3 py-1.5 text-sm text-violet-400 bg-violet-950/40 border border-violet-800/30 rounded-full">
              + more every week
            </span>
          </div>
          <p className="mt-6 text-sm text-slate-600">
            Need an integration not listed?{" "}
            <a
              href="https://github.com/alifanov/scopegate/issues"
              className="text-violet-500 hover:text-violet-400 transition-colors"
            >
              Request it on GitHub →
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-3xl font-bold text-slate-50">
            Ready to add a permission layer?
          </h2>
          <p className="text-slate-400">
            Start free — one project, five endpoints, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="inline-flex cursor-pointer items-center justify-center px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-all duration-150 shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex cursor-pointer items-center justify-center px-6 py-3 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-xl font-medium text-sm transition-all duration-150"
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
