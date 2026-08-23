"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CODE_LINES = [
  { type: "comment", text: "// ⚠️  Before — agent has full API access" },
  { type: "dim",     text: "const agent = new MCPClient({" },
  { type: "bad",     text: '  apiKey: process.env.GOOGLE_FULL_KEY,' },
  { type: "bad",     text: "  //  read, write, delete — everything" },
  { type: "dim",     text: "});" },
  { type: "blank",   text: "" },
  { type: "comment", text: "// ✅  After — scoped with ScopeGate" },
  { type: "dim",     text: "const agent = new MCPClient({" },
  { type: "good",    text: '  endpoint: "scopegate.dev/api/mcp/sg_k9x2…",' },
  { type: "good",    text: "  //  drive: list + read, never delete" },
  { type: "good",    text: "  //  rate limit: 60 req/min" },
  { type: "good",    text: "  //  audit trail: every action logged" },
  { type: "dim",     text: "});" },
];

const colorMap: Record<string, string> = {
  comment: "text-slate-400",
  dim:     "text-slate-300",
  bad:     "text-red-400",
  good:    "text-emerald-400",
  blank:   "",
};

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L12 3.5V7.5C12 10.26 9.31 12.26 7 13C4.69 12.26 2 10.26 2 7.5V3.5L7 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M8 1L3 8h4l-1 5 5-7H7l1-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Hero() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= CODE_LINES.length) clearInterval(timer);
    }, 110);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-start lg:items-center pt-20 pb-16 overflow-hidden">
      {/* dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-100 pointer-events-none" />

      {/* left glow */}
      <div className="absolute top-1/3 -left-32 w-[560px] h-[560px] bg-violet-600/12 rounded-full blur-[100px] pointer-events-none" />
      {/* right glow */}
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left ── */}
          <div className="space-y-8 min-w-0">
            {/* badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 bg-violet-950/70 border border-violet-700/30 rounded-full px-4 py-1.5 text-xs text-violet-300 font-medium">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              Open-source · Self-hostable · MCP-native
            </div>

            {/* headline */}
            <div className="animate-fade-up animate-delay-100 space-y-2">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight text-slate-50">
                Your AI agents<br />
                have{" "}
                <span className="shimmer-text">god-mode</span>
                <br />
                access to your data.
              </h1>
              <p className="text-2xl text-slate-400 font-light pt-1">
                It&apos;s time to fix that.
              </p>
            </div>

            {/* CTAs */}
            <div className="animate-fade-up animate-delay-200">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex cursor-pointer items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 shadow-xl shadow-violet-900/40 hover:shadow-violet-700/40 hover:-translate-y-0.5"
                >
                  Start free — no card needed
                  <ArrowRightIcon />
                </Link>
                <a
                  href="https://github.com/alifanov/scopegate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-150"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            {/* description */}
            <p className="animate-fade-up animate-delay-300 hidden sm:block text-lg text-slate-400 max-w-[480px] leading-relaxed">
              ScopeGate is a permission gateway between your AI agents and the
              accounts they reach — yours or your clients&apos;. Connect a service
              once, toggle the exact actions each agent may call, and hand it a
              scoped MCP endpoint where every request is logged.
            </p>

            {/* trust signals */}
            <div className="animate-fade-up animate-delay-400 flex flex-wrap items-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-violet-500"><ShieldIcon /></span>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-violet-500"><ZapIcon /></span>
                Free tier forever
              </span>
              <a
                href="https://github.com/alifanov/scopegate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-1.5 hover:text-slate-300 transition-colors"
              >
                <span className="text-violet-500"><LockIcon /></span>
                Open-source (GitHub)
              </a>
            </div>
          </div>

          {/* ── Right: Code block ── */}
          <div className="animate-fade-up animate-delay-300 relative">
            <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl shadow-black/60">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-slate-400 font-mono">agent-setup.ts</span>
              </div>

              {/* code lines — all rows always rendered (reserves final height, no CLS);
                  not-yet-typed rows are `invisible` so they still occupy their line box */}
              <div className="p-5 font-mono text-[13px] leading-7">
                {CODE_LINES.map((line, i) => {
                  const shown = i < visibleLines;
                  return (
                    <div key={line.text || `blank-${i}`} className={shown ? undefined : "invisible"}>
                      {line.type === "blank" ? (
                        <span>&nbsp;</span>
                      ) : (
                        <span className={colorMap[line.type]}>{line.text}</span>
                      )}
                      {shown && i === visibleLines - 1 && visibleLines < CODE_LINES.length && (
                        <span className="inline-block w-[7px] h-[14px] bg-violet-400 animate-cursor align-middle ml-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* floating badge: secured */}
            <div className="absolute -bottom-4 -right-3 animate-float bg-emerald-950/90 border border-emerald-800/60 rounded-xl px-4 py-2.5 shadow-xl shadow-black/40">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                Agent secured in 4m 32s
              </div>
            </div>

            {/* floating badge: 0 incidents */}
            <div className="absolute -top-4 -left-3 animate-float [animation-delay:2s] bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-xl shadow-black/40">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 bg-violet-400 rounded-full" />
                0 security incidents
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
