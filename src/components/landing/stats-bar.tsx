const STATS = [
  {
    value: "88%",
    label: "of organizations experienced AI agent security incidents",
    color: "text-red-400",
  },
  {
    value: "90%+",
    label: "of MCP servers are over-permissioned by default",
    color: "text-orange-400",
  },
  {
    value: "34%",
    label: "of companies have any AI security controls in place",
    color: "text-yellow-400",
  },
  {
    value: "97M+",
    label: "monthly MCP SDK downloads and growing 58× year-over-year",
    color: "text-violet-400",
  },
];

export function StatsBar() {
  return (
    <section className="border-y border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className="text-center space-y-2 px-4 lg:border-r last:border-r-0 border-slate-800/40"
            >
              <div className={`text-4xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-slate-500 leading-snug max-w-[180px] mx-auto">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-600 mt-8">
          Sources: Gravitee State of AI Agent Security 2026 · Clutch Security · MCP Anniversary Blog · Noma Security
        </p>
      </div>
    </section>
  );
}
