import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { comparisons, type ComparisonData } from "@/data/comparisons";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";

/* ---------- static params ---------- */

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export const viewport = MARKETING_VIEWPORT;

/* ---------- metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = comparisons.find((c) => c.slug === slug);
  if (!data) return {};

  return {
    title: { absolute: data.metaTitle },
    description: data.metaDescription,
    alternates: { canonical: `https://scopegate.dev/compare/${data.slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `https://scopegate.dev/compare/${data.slug}`,
    },
  };
}

/* ---------- icons ---------- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <path
        d="M4.5 9.5L7.5 12.5L13.5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <path
        d="M5.5 5.5L12.5 12.5M5.5 12.5L12.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TieIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <path
        d="M4 9h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- feature row ---------- */

function WinnerBadge({
  winner,
  side,
}: {
  winner: ComparisonData["features"][number]["winner"];
  side: "scopegate" | "competitor";
}) {
  if (winner === "tie") {
    return <TieIcon className="text-slate-500 mx-auto" />;
  }
  if (winner === side) {
    return <CheckIcon className="text-emerald-400 mx-auto" />;
  }
  return <CrossIcon className="text-slate-600 mx-auto" />;
}

/* ---------- page ---------- */

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = comparisons.find((c) => c.slug === slug);
  if (!data) notFound();

  const others = comparisons.filter((c) => c.slug !== slug);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://scopegate.dev" },
      { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://scopegate.dev/compare" },
      { "@type": "ListItem", "position": 3, "name": `ScopeGate vs ${data.competitor}`, "item": `https://scopegate.dev/compare/${data.slug}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.metaTitle,
    description: data.metaDescription,
    url: `https://scopegate.dev/compare/${data.slug}`,
    publisher: {
      "@type": "Organization",
      name: "ScopeGate",
      url: "https://scopegate.dev",
    },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the difference between ScopeGate and ${data.competitor}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: data.intro,
          },
        },
        {
          "@type": "Question",
          name: `Should I use ScopeGate or ${data.competitor}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: data.verdict,
          },
        },
        {
          "@type": "Question",
          name: `Who is ScopeGate best for compared to ${data.competitor}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `ScopeGate is best for: ${data.bestFor.scopegate} ${data.competitor} is best for: ${data.bestFor.competitor}`,
          },
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/compare"
              className="hover:text-slate-300 transition-colors"
            >
              Comparisons
            </Link>
            <span>/</span>
            <span className="text-slate-300">
              ScopeGate vs {data.competitor}
            </span>
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            ScopeGate vs {data.competitor}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
            {data.intro}
          </p>
        </section>

        {/* Feature comparison table */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold mb-6">Feature comparison</h2>

          <div className="rounded-xl border border-slate-800/60 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto_1fr_auto] sm:grid-cols-[2fr_2fr_60px_2fr_60px] bg-slate-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60">
              <div>Feature</div>
              <div>ScopeGate</div>
              <div className="text-center" />
              <div>{data.competitor}</div>
              <div className="text-center" />
            </div>

            {/* Rows */}
            {data.features.map((f, i) => (
              <div
                key={f.feature}
                className={`grid grid-cols-[1fr_1fr_auto_1fr_auto] sm:grid-cols-[2fr_2fr_60px_2fr_60px] px-4 py-4 text-sm items-center gap-2 ${
                  i % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/10"
                } ${
                  i < data.features.length - 1
                    ? "border-b border-slate-800/40"
                    : ""
                }`}
              >
                <div className="font-medium text-slate-200">{f.feature}</div>
                <div className="text-slate-400">{f.scopegate}</div>
                <div className="flex justify-center">
                  <WinnerBadge winner={f.winner} side="scopegate" />
                </div>
                <div className="text-slate-400">{f.competitor}</div>
                <div className="flex justify-center">
                  <WinnerBadge winner={f.winner} side="competitor" />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-600 mt-3">
            <CheckIcon className="text-emerald-400 inline -mt-0.5 mr-1" />
            Winner in this category &middot;{" "}
            <TieIcon className="text-slate-500 inline -mt-0.5 mr-1" />
            Tie
          </p>
        </section>

        {/* Advantages sections */}
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6 mb-16">
          {/* ScopeGate wins */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">
              Where ScopeGate wins
            </h2>
            <ul className="space-y-3">
              {data.scopegateAdvantages.map((a) => (
                <li key={a} className="flex gap-3 text-sm text-slate-300">
                  <CheckIcon className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitor wins */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
            <h2 className="text-xl font-bold mb-4 text-violet-400">
              Where {data.competitor} wins
            </h2>
            <ul className="space-y-3">
              {data.competitorAdvantages.map((a) => (
                <li key={a} className="flex gap-3 text-sm text-slate-300">
                  <CheckIcon className="text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verdict */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold mb-4">The verdict</h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            {data.verdict}
          </p>
        </section>

        {/* Best for */}
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold mb-6">Who should pick which?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Pick ScopeGate if
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.bestFor.scopegate}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
              <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                Pick {data.competitor} if
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {data.bestFor.competitor}
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 mb-16 text-center">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-10">
            <h2 className="text-2xl font-bold mb-3">
              Ready to try ScopeGate?
            </h2>
            <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Free tier with 1 project, 5 endpoints, and 1K requests/month. Set
              up per-agent permissions in under 5 minutes.
            </p>
            <a
              href="https://github.com/alifanov/scopegate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Other comparisons */}
        <section className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">See also</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {others.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group rounded-lg border border-slate-800/60 bg-slate-900/30 hover:bg-slate-900/60 hover:border-violet-500/30 transition-all duration-200 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">
                  ScopeGate vs {c.competitor}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-slate-600 group-hover:text-violet-400 transition-colors"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
