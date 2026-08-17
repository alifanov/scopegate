import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { glossaryEntries, type GlossaryEntry } from "@/data/glossary";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";

/* ---------- static params ---------- */

export function generateStaticParams() {
  return glossaryEntries.map((e) => ({ slug: e.slug }));
}

export const viewport = MARKETING_VIEWPORT;

/* ---------- metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = glossaryEntries.find((e) => e.slug === slug);
  if (!entry) return {};
  return {
    title: { absolute: entry.metaTitle },
    description: entry.metaDescription,
    alternates: { canonical: `https://scopegate.dev/glossary/${entry.slug}` },
  };
}

/* ---------- helpers ---------- */

function getRelatedEntries(entry: GlossaryEntry): GlossaryEntry[] {
  return entry.relatedTerms
    .map((slug) => glossaryEntries.find((e) => e.slug === slug))
    .filter((e): e is GlossaryEntry => !!e);
}

function buildJsonLd(entry: GlossaryEntry) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://scopegate.dev" },
      { "@type": "ListItem", "position": 2, "name": "Glossary", "item": "https://scopegate.dev/glossary" },
      { "@type": "ListItem", "position": 3, "name": entry.term, "item": `https://scopegate.dev/glossary/${entry.slug}` },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.headline,
    description: entry.metaDescription,
    author: { "@type": "Organization", name: "ScopeGate", url: "https://scopegate.dev" },
    publisher: { "@type": "Organization", name: "ScopeGate", url: "https://scopegate.dev" },
    mainEntityOfPage: `https://scopegate.dev/glossary/${entry.slug}`,
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entry.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return [breadcrumb, article, faqPage];
}

/* ---------- page ---------- */

export default async function GlossaryEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = glossaryEntries.find((e) => e.slug === slug);
  if (!entry) notFound();

  const related = getRelatedEntries(entry);
  const jsonLd = buildJsonLd(entry);

  return (
    <>
      <Navbar />

      {/* JSON-LD */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main className="min-h-screen bg-slate-950 pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link
                  href="/glossary"
                  className="hover:text-slate-300 transition-colors"
                >
                  Glossary
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-300">{entry.term}</li>
            </ol>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-6">
            {entry.headline}
          </h1>

          {/* TL;DR box */}
          <div className="rounded-xl border border-violet-600/30 bg-violet-500/5 p-5 mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">
              TL;DR
            </p>
            <p className="text-slate-300 leading-relaxed">{entry.tldr}</p>
          </div>

          {/* Content sections */}
          {entry.sections.map((section, i) => (
            <section key={i} className="mb-10">
              <h2 className="text-xl font-semibold text-slate-100 mb-3">
                {section.heading}
              </h2>
              <p className="text-slate-400 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </section>
          ))}

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {entry.faq.map((f, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-5"
                >
                  <h3 className="font-medium text-slate-200 mb-2">
                    {f.question}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ScopeGate CTA callout */}
          <div className="rounded-xl border border-violet-600/30 bg-violet-500/5 p-6 mb-12">
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              How ScopeGate Helps
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              {entry.ctaText}
            </p>
            <Link
              href="/signup"
              className="inline-block cursor-pointer text-sm bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
          </div>

          {/* Related terms */}
          {related.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">
                Related Terms
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-300 hover:border-violet-600/40 hover:text-violet-400 transition-all duration-150"
                  >
                    {r.term}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back link */}
          <Link
            href="/glossary"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="rotate-180"
            >
              <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Glossary
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
