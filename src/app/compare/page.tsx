import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { comparisons } from "@/data/comparisons";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGate vs Alternatives — MCP Gateway Comparison",
  description:
    "Compare ScopeGate with MCP gateways, AI agent platforms, and API proxies. See feature-by-feature breakdowns for Obot, Keycard, LiteLLM, Arcade, Composio, and more.",
  alternates: { canonical: "https://scopegate.dev/compare" },
  openGraph: {
    title: "ScopeGate vs Alternatives — MCP Gateway Comparison",
    description:
      "Compare ScopeGate with MCP gateways, AI agent platforms, and API proxies. Feature-by-feature breakdowns for 10 competitors.",
    url: "https://scopegate.dev/compare",
  },
};

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-violet-400 group-hover:translate-x-0.5 transition-transform"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ComparePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ScopeGate vs Alternatives — MCP Gateway Comparison",
    description:
      "Compare ScopeGate with MCP gateways, AI agent platforms, and API proxies.",
    url: "https://scopegate.dev/compare",
    publisher: {
      "@type": "Organization",
      name: "ScopeGate",
      url: "https://scopegate.dev",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            How ScopeGate compares
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Honest, feature-by-feature comparisons with MCP gateways, AI agent
            platforms, and API proxies. See where ScopeGate wins — and where
            alternatives might be a better fit.
          </p>
        </section>

        {/* Grid */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisons.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-900/70 hover:border-violet-500/30 transition-all duration-200 p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">
                    vs {c.competitor}
                  </h2>
                  <ArrowIcon />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {c.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 text-center">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-10">
            <h2 className="text-2xl font-bold mb-3">
              Ready to control what your AI agents can access?
            </h2>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Start with the free tier. Set up per-agent permissions in under 5
              minutes — no credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex cursor-pointer items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
