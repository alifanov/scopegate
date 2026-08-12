import Link from "next/link";

const INTEGRATIONS = [
  {
    name: "Google Drive",
    color: "#4285F4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <path d="M6.75 17.5L1.5 8.5l4.5-7h12l4.5 7-4.5 7.5H6.75z" stroke="#4285F4" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M6.75 17.5h10.5M9 3.5l6 10.5M15 3.5L9 14" stroke="#4285F4" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Gmail",
    color: "#EA4335",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#EA4335" strokeWidth="1.3" />
        <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Google Calendar",
    color: "#34A853",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="#34A853" strokeWidth="1.3" />
        <path d="M3 9h18M8 2v4M16 2v4" stroke="#34A853" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="7" y="12" width="4" height="4" rx="0.5" fill="#34A853" />
      </svg>
    ),
  },
  {
    name: "Stripe",
    color: "#635BFF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="#635BFF" strokeWidth="1.3" />
        <path d="M14.5 9.5c-.6-.6-1.6-.9-2.5-.9-1.2 0-2 .5-2 1.3 0 .9 1 1.2 2.2 1.5 1.5.4 2.6.9 2.6 2.2 0 1.3-1.2 2-2.8 2-1 0-2.1-.3-2.8-1" stroke="#635BFF" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Slack",
    color: "#E01E5A",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <circle cx="8.5" cy="15.5" r="2" stroke="#E01E5A" strokeWidth="1.3" />
        <path d="M8.5 13.5V7" stroke="#E01E5A" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="15.5" cy="8.5" r="2" stroke="#36C5F0" strokeWidth="1.3" />
        <path d="M13.5 8.5H7" stroke="#36C5F0" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="15.5" cy="15.5" r="2" stroke="#2EB67D" strokeWidth="1.3" />
        <path d="M15.5 13.5V7" stroke="#2EB67D" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8.5" cy="8.5" r="2" stroke="#ECB22E" strokeWidth="1.3" />
        <path d="M10.5 8.5H17" stroke="#ECB22E" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Notion",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="3" y="2" width="18" height="20" rx="2" stroke="#94a3b8" strokeWidth="1.3" />
        <path d="M7 7h6M7 11h8M7 15h5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    color: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="#94a3b8" className="w-7 h-7">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Twitter / X",
    color: "#1DA1F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="#94a3b8" className="w-7 h-7">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "OpenRouter",
    color: "#7c3aed",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <circle cx="12" cy="12" r="9" stroke="#a78bfa" strokeWidth="1.3" />
        <path d="M9 8h6M9 12h6M9 16h4" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <rect x="2" y="2" width="20" height="20" rx="4" stroke="#0A66C2" strokeWidth="1.3" />
        <path d="M7 10v7M7 7v.5" stroke="#0A66C2" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 17v-3.5a2.5 2.5 0 0 1 5 0V17M11 10v7" stroke="#0A66C2" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Google Ads",
    color: "#FBBC04",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <path d="M3 17L9 7l4 6.93" stroke="#FBBC04" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="17" r="3" stroke="#4285F4" strokeWidth="1.3" />
        <circle cx="9" cy="17" r="3" stroke="#34A853" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    name: "More coming",
    color: "#475569",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <circle cx="5" cy="12" r="1.5" fill="#475569" />
        <circle cx="12" cy="12" r="1.5" fill="#475569" />
        <circle cx="19" cy="12" r="1.5" fill="#475569" />
      </svg>
    ),
  },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-28 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-14">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            Integrations
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
            Works with the tools<br />
            <span className="text-slate-500">your team already uses</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Each integration is a scoped MCP endpoint. Add a new service in seconds.
          </p>
        </div>

        {/* grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className={`relative group flex flex-col items-center justify-center gap-2.5 rounded-xl border p-4 transition-all duration-200 cursor-default ${
                integration.name === "More coming"
                  ? "border-slate-800/30 bg-slate-900/20"
                  : "border-slate-800/60 bg-slate-900/50 hover:border-violet-700/40 hover:bg-violet-950/20 hover:-translate-y-0.5"
              }`}
            >
              {integration.icon}
              <span className={`text-[10px] font-medium text-center leading-tight ${
                integration.name === "More coming" ? "text-slate-700" : "text-slate-500 group-hover:text-slate-400"
              } transition-colors`}>
                {integration.name}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 space-y-2">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View all integrations
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-px">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-slate-700">
            Don&apos;t see your service?{" "}
            <a href="https://github.com/alifanov/scopegate/issues" className="text-violet-600 hover:text-violet-400 transition-colors">
              Request an integration →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
