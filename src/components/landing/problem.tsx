function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L18 16H2L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4M10 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FileXIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 2v5h5M7.5 11.5l3 3M10.5 11.5l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ZapOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L5 11h5l-1 7 7-9h-5l1-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const PROBLEMS = [
  {
    icon: AlertIcon,
    title: "No scope control",
    description:
      "MCP servers request broad OAuth scopes with no mechanism to restrict what each individual AI agent can actually do. Agent A and Agent B both get full access — or nothing at all.",
    accent: "text-red-400",
    bg: "bg-red-950/20",
    border: "border-red-900/25",
    glow: "shadow-red-950/30",
  },
  {
    icon: FileXIcon,
    title: "No audit trail",
    description:
      "Who can tell you what your AI agent did at 3am? MCP has no standardized logging. If something goes wrong — a deletion, an unauthorized send — you have no way to reconstruct it.",
    accent: "text-orange-400",
    bg: "bg-orange-950/20",
    border: "border-orange-900/25",
    glow: "shadow-orange-950/30",
  },
  {
    icon: ZapOffIcon,
    title: "No instant revocation",
    description:
      "When you need to cut off an agent, you're hunting through Google IAM, Slack settings, Notion, and GitHub separately. There's no single kill-switch that works across all services.",
    accent: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-900/25",
    glow: "shadow-yellow-950/30",
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            The problem
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 leading-tight">
            AI agents have become
            <br />
            <span className="text-slate-500">authorization bypass paths</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Authorization is evaluated against the agent&apos;s identity, not the
            requester&apos;s. Traditional security controls are insufficient for
            autonomous agents that <em className="text-slate-300">reason</em> instead of execute.
          </p>
        </div>

        {/* cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PROBLEMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`rounded-2xl border p-7 space-y-5 ${p.bg} ${p.border} shadow-lg ${p.glow}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-current/10 ${p.accent}`}>
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
              </div>
            );
          })}
        </div>

        {/* quote */}
        <div className="mt-14 bg-slate-900/60 rounded-2xl border border-slate-800/60 p-10 text-center max-w-3xl mx-auto">
          <svg className="w-8 h-8 text-slate-700 mx-auto mb-4" fill="currentColor" viewBox="0 0 32 32">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <blockquote className="text-xl text-slate-300 leading-relaxed italic">
            Agents quietly accumulate permissions as their scope expands.
            Integrations are added, roles change, teams come and go — but the
            agent&apos;s access remains.
          </blockquote>
          <p className="mt-5 text-sm text-slate-600">
            — The Hacker News, &ldquo;Who Approved This Agent?&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
