import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-28 bg-slate-900/30">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
        {/* icon */}
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-700/30 flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-violet-400">
            <path d="M14 3L25 8.5v6c0 6.075-4.925 9.625-11 11-6.075-1.375-11-4.925-11-11v-6L14 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9.5 14l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* headline */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 leading-tight">
            Open-source permission layer
            <br />
            <span className="text-violet-400">for your AI agents</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Self-host it in minutes. No vendor lock-in. Full control over your
            agent permissions and audit trail.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex cursor-pointer items-center justify-center gap-2 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5 shadow-xl shadow-violet-900/30"
          >
            Start free — no card needed
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="https://github.com/alifanov/scopegate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center gap-2 px-8 py-3.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-xl font-medium text-sm transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            MIT license
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Self-hostable
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Open-source core
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            GDPR compliant
          </span>
        </div>
      </div>
    </section>
  );
}
