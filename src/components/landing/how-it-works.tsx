import Link from "next/link";

function LinkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 6h14M4 11h14M4 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="11" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="16" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="3" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 8l3 3-3 3M12 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  {
    number: "01",
    icon: LinkIcon,
    title: "Connect a service",
    description:
      "One-click OAuth to connect Google Drive, Gmail, Calendar, Slack, Notion, Stripe and 20+ more. No manual token management.",
    detail: "OAuth 2.0 · Auto token refresh · Encrypted at rest",
    code: "google-drive · connected ✓\n→ token encrypted, auto-refresh on",
  },
  {
    number: "02",
    icon: SlidersIcon,
    title: "Define agent scopes",
    description:
      "Toggle exactly which actions an agent may call: list and read files but never delete, send mail but never read the inbox. Everything is off until you switch it on.",
    detail: "Per-endpoint · Per-action · Default deny · Rate limits",
    code: 'Endpoint: "sales-assistant"\n drive: list + read ✓\n drive: delete ✗',
  },
  {
    number: "03",
    icon: TerminalIcon,
    title: "Copy your MCP endpoint",
    description:
      "A unique, scoped MCP endpoint URL is generated. Paste it into your agent config. The proxy handles enforcement, logging, and revocation.",
    detail: "Instant activation · Works with any MCP client · Audit trail live",
    code: "scopegate.dev/api/mcp/sg_k9x2…\n→ Agent ready in 4m 32s ✓",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-20">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
            Secure in under 5 minutes
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No Kubernetes. No procurement cycle. No mandatory sales call.
            Just connect, configure, and ship.
          </p>
        </div>

        {/* steps */}
        <div className="relative grid md:grid-cols-3 gap-6">
          {/* connecting line (desktop) */}
          <div className="hidden md:block absolute top-11 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-transparent via-violet-600/40 to-transparent" />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-slate-900 rounded-2xl border border-slate-800/60 p-7 space-y-5 hover:border-violet-800/40 transition-colors group"
              >
                {/* step dot on line */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-violet-600/15 border border-violet-700/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/25 transition-colors">
                    <Icon />
                  </div>
                  <span className="text-4xl font-bold text-slate-800 tabular-nums select-none">
                    {step.number}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-100">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>

                {/* mini code */}
                <div className="bg-slate-950/60 rounded-lg p-3 font-mono text-xs text-emerald-400 leading-5 whitespace-pre">
                  {step.code}
                </div>

                <p className="text-xs text-slate-600">{step.detail}</p>
              </div>
            );
          })}
        </div>

        {/* bottom cta */}
        <div className="mt-14 text-center">
          <Link
            href="/signup"
            className="inline-flex cursor-pointer items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-xl shadow-violet-900/30"
          >
            Start free — no card needed
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
