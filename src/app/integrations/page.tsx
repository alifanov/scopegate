import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { integrations } from "@/data/integrations-seo";

export const metadata: Metadata = {
  title: "Integrations \u2014 Secure Google, Slack, GitHub & More for AI Agents",
  description:
    "Browse ScopeGate integrations. Set granular AI agent permissions for Google Drive, Gmail, Slack, GitHub, Notion, Twitter, LinkedIn, Google Ads, OpenRouter, and more.",
  alternates: {
    canonical: "https://scopegate.dev/integrations",
  },
};

function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ScopeGate Integrations",
    description:
      "Granular AI agent permissions for Google Drive, Gmail, Slack, GitHub, Notion, and more.",
    url: "https://scopegate.dev/integrations",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: integrations.map((integration, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://scopegate.dev/integrations/${integration.slug}`,
        name: `Secure ${integration.service} for AI Agents`,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function IntegrationsPage() {
  return (
    <>
      <SchemaMarkup />
      <Navbar />

      <main className="min-h-screen bg-slate-950 pt-28 pb-20">
        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight mb-4">
            Integrations
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Granular AI agent permissions for every service. Connect via OAuth,
            define exactly what your agent can access, and get a secure MCP
            endpoint.
          </p>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((integration) => (
              <Link
                key={integration.slug}
                href={`/integrations/${integration.slug}`}
                className="group relative rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 hover:border-violet-600/40 hover:bg-slate-900/70 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="text-3xl flex-shrink-0"
                    role="img"
                    aria-label={integration.service}
                  >
                    {integration.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-100 group-hover:text-violet-400 transition-colors mb-1.5">
                      {integration.service}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {integration.metaDescription}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {integration.permissions.slice(0, 3).map((perm) => (
                    <span
                      key={perm.name}
                      className="text-xs bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-md"
                    >
                      {perm.name}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 text-center">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
              Don&apos;t see your service?
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
              ScopeGate is open-core and extensible. Request an integration or
              build your own permission proxy with our self-hosting guide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/alifanov/scopegate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all duration-150 shadow-lg shadow-violet-900/30"
              >
                View on GitHub
              </a>
              <a
                href="https://github.com/alifanov/scopegate/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
              >
                Request integration
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
