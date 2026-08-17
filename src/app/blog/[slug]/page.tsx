import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { blogPosts, type BlogPost } from "@/data/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";

/* ---------- static params ---------- */

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export const viewport = MARKETING_VIEWPORT;

/* ---------- metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: { absolute: post.metaTitle },
    description: post.metaDescription,
    alternates: { canonical: `https://scopegate.dev/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://scopegate.dev/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

/* ---------- helpers ---------- */

function getRelatedPosts(post: BlogPost): BlogPost[] {
  return post.relatedSlugs
    .map((slug) => blogPosts.find((p) => p.slug === slug))
    .filter((p): p is BlogPost => !!p);
}

function buildJsonLd(post: BlogPost) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.headline,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "ScopeGate",
      url: "https://scopegate.dev",
    },
    publisher: {
      "@type": "Organization",
      name: "ScopeGate",
      url: "https://scopegate.dev",
    },
    mainEntityOfPage: `https://scopegate.dev/blog/${post.slug}`,
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return [article, faqPage];
}

/* ---------- render content with inline code ---------- */

function renderContent(content: string) {
  // Split on backtick-wrapped segments and render <code> tags
  const parts = content.split(/`([^`]+)`/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="px-1.5 py-0.5 rounded bg-slate-800 text-violet-300 text-[0.85em] font-mono"
      >
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ---------- page ---------- */

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const jsonLd = buildJsonLd(post);

  return (
    <>
      <Navbar />

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
                  href="/blog"
                  className="hover:text-slate-300 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-300 truncate max-w-[300px]">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Published date */}
          <time className="text-xs text-slate-500 font-mono">
            {post.publishedAt}
          </time>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mt-2 mb-6">
            {post.headline}
          </h1>

          {/* TL;DR box */}
          <div className="rounded-xl border border-violet-600/30 bg-violet-500/5 p-5 mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">
              TL;DR
            </p>
            <p className="text-slate-300 leading-relaxed">{post.tldr}</p>
          </div>

          {/* Table of contents */}
          <nav className="mb-12 rounded-xl border border-slate-800/60 bg-slate-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              In this article
            </p>
            <ol className="space-y-1.5">
              {post.sections.map((section, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="text-sm text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    {i + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Content sections */}
          {post.sections.map((section, i) => (
            <section key={i} id={`section-${i}`} className="mb-10">
              <h2 className="text-xl font-semibold text-slate-100 mb-3">
                {section.heading}
              </h2>
              <div className="text-slate-400 leading-relaxed whitespace-pre-line">
                {renderContent(section.content)}
              </div>
            </section>
          ))}

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {post.faq.map((f, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-5"
                >
                  <h3 className="font-medium text-slate-200 mb-2">
                    {f.question}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {renderContent(f.answer)}
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
              {post.ctaText}
            </p>
            <Link
              href="/signup"
              className="inline-block cursor-pointer text-sm bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">
                Related Articles
              </h2>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group block rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-violet-600/40 hover:bg-violet-500/5 transition-all duration-150 p-4"
                  >
                    <h3 className="font-medium text-slate-200 group-hover:text-violet-400 transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                      {r.tldr}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back link */}
          <Link
            href="/blog"
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
            Back to Blog
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
