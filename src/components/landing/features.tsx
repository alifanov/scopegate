import Link from "next/link";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2.5 7.5l3.5 3.5 5.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PERMISSION_MATRIX = [
  { agent: "sales-assistant", drive: "list + read", gmail: "send only",   calendar: "list only" },
  { agent: "hr-bot",          drive: "list only",   gmail: "—",           calendar: "list + create" },
  { agent: "dev-agent",       drive: "—",           gmail: "—",           calendar: "—" },
];

const SMALL_FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l8 4v5c0 4.418-3.582 7-8 8-4.418-1-8-3.582-8-8V6l8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "5-min developer onboarding",
    description:
      "No Kubernetes. No Entra ID. No platform team. One OAuth click, one config line, one MCP URL. You\u2019re live.",
    bullets: ["Visual toggle matrix", "Per-action toggles", "Auto-generated endpoint"],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 6v4.5l3 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M3 10H1M19 10h-2M10 1v2M10 17v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Instant cross-service revocation",
    description:
      "One click. All services. The proxy stops forwarding immediately — no waiting for OAuth tokens to expire.",
    bullets: ["All services at once", "Automated triggers", "Recorded in audit log"],
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 8h16M6 12h2M10 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: "Full audit trail",
    description:
      "Every tool call logged: action, params, status, error, duration. Queryable, exportable, and retention-configurable.",
    bullets: ["Every request logged", "SOC 2 ready", "7–365 day retention"],
  },
];

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
            The missing permission layer
            <br />
            <span className="text-slate-400">for the MCP ecosystem</span>
          </h2>
        </div>

        {/* asymmetric grid */}
        <div className="grid lg:grid-cols-5 gap-5">
          {/* large left card — per-agent scope control */}
          <div className="lg:col-span-3 min-w-0 bg-gradient-to-br from-violet-950/40 to-slate-900 rounded-2xl border border-violet-800/20 p-8 space-y-6">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-700/30 flex items-center justify-center text-violet-400">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="12" y="2" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2" y="12" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="16" cy="16" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 16h4M16 14v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                Per-agent, per-action granular scope control
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Every agent gets its own permission profile. Each individual action is a
                separate toggle, and everything is off until you switch it on.
                Not team-level. Not org-level. <em className="text-slate-300">Per agent.</em>
              </p>
            </div>

            {/* permission matrix visualization */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800/50 text-xs text-slate-400 font-mono">
                Permission matrix
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="px-4 py-2.5 text-left text-slate-400 font-normal">Agent</th>
                      <th className="px-4 py-2.5 text-left text-slate-400 font-normal">Drive</th>
                      <th className="px-4 py-2.5 text-left text-slate-400 font-normal">Gmail</th>
                      <th className="px-4 py-2.5 text-left text-slate-400 font-normal">Calendar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MATRIX.map((row) => (
                      <tr key={row.agent} className="border-b last:border-b-0 border-slate-800/30">
                        <td className="px-4 py-2.5 text-violet-400">{row.agent}</td>
                        <td className="px-4 py-2.5">
                          {row.drive === "—" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="text-emerald-400">{row.drive}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.gmail === "—" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="text-emerald-400">{row.gmail}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.calendar === "—" ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className="text-emerald-400">{row.calendar}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Per-action scopes", "Rate limit per endpoint", "Default deny", "Instant toggle"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-950/50 border border-violet-800/30 rounded-full px-3 py-1"
                >
                  <CheckIcon className="text-violet-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 3 small right cards */}
          <div className="lg:col-span-2 min-w-0 grid sm:grid-cols-1 gap-5">
            {SMALL_FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900 rounded-2xl border border-slate-800/60 p-6 space-y-4 hover:border-slate-700/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/15 group-hover:border group-hover:border-violet-700/30 transition-all">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
                <ul className="space-y-1">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckIcon className="text-violet-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Explore all features
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-px">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
