import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { integrations } from "@/data/integrations-seo";
import type { IntegrationData } from "@/data/integrations-seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return integrations.map((i) => ({ slug: i.slug }));
}

export const viewport = MARKETING_VIEWPORT;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = integrations.find((i) => i.slug === slug);
  if (!integration) return {};

  return {
    title: { absolute: integration.metaTitle },
    description: integration.metaDescription,
    alternates: {
      canonical: `https://scopegate.dev/integrations/${integration.slug}`,
    },
    openGraph: {
      title: integration.metaTitle,
      description: integration.metaDescription,
      url: `https://scopegate.dev/integrations/${integration.slug}`,
    },
  };
}

function SchemaMarkup({ integration }: { integration: IntegrationData }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://scopegate.dev" },
      { "@type": "ListItem", "position": 2, "name": "Integrations", "item": "https://scopegate.dev/integrations" },
      { "@type": "ListItem", "position": 3, "name": integration.service, "item": `https://scopegate.dev/integrations/${integration.slug}` },
    ],
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `ScopeGate ${integration.service} Integration`,
    applicationCategory: "SecurityApplication",
    description: integration.metaDescription,
    url: `https://scopegate.dev/integrations/${integration.slug}`,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available with 1 project, 5 endpoints, 1K requests/mo",
    },
    featureList: integration.permissions.map((p) => p.name),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}

const STEPS = [
  {
    number: "1",
    title: "Connect via OAuth",
    description:
      "Authorize ScopeGate to access the service on your behalf. We never store raw credentials \u2014 only scoped OAuth tokens.",
  },
  {
    number: "2",
    title: "Set granular permissions",
    description:
      "Choose exactly which resources, actions, and data your AI agent can access. Lock down everything else.",
  },
  {
    number: "3",
    title: "Get your MCP endpoint",
    description:
      "Receive a unique MCP endpoint URL. Plug it into any AI agent \u2014 it can only do what you allowed.",
  },
];

export default async function IntegrationPage({ params }: PageProps) {
  const { slug } = await params;
  const integration = integrations.find((i) => i.slug === slug);
  if (!integration) notFound();

  const related = integration.relatedIntegrations
    .map((s) => integrations.find((i) => i.slug === s))
    .filter(Boolean) as IntegrationData[];

  return (
    <>
      <SchemaMarkup integration={integration} />
      <Navbar />

      <main className="min-h-screen bg-slate-950 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link
                  href="/integrations"
                  className="hover:text-slate-300 transition-colors"
                >
                  Integrations
                </Link>
              </li>
              <li aria-hidden="true">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-slate-600"
                >
                  <path
                    d="M4.5 2.5L7.5 6L4.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </li>
              <li className="text-slate-300">{integration.service}</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-16">
            <span className="text-5xl mb-4 block" role="img" aria-label={integration.service}>
              {integration.icon}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-6">
              {integration.headline}
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              {integration.intro}
            </p>
          </header>

          {/* The Problem */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">
              The Problem
            </h2>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-slate-300 leading-relaxed">
                {integration.problem}
              </p>
            </div>
          </section>

          {/* Granular Permissions */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Granular Permissions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {integration.permissions.map((perm) => (
                <div
                  key={perm.name}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                    <h3 className="text-base font-semibold text-slate-100">
                      {perm.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">
                    {perm.description}
                  </p>
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                      Example
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {perm.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Use Cases */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Use Cases
            </h2>
            <ul className="space-y-4">
              {integration.useCases.map((useCase) => (
                <li key={useCase} className="flex items-start gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-violet-400 flex-shrink-0 mt-0.5"
                  >
                    <path
                      d="M7 10L9 12L13 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                  <span className="text-slate-300 leading-relaxed">
                    {useCase}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-700/40 flex items-center justify-center text-violet-400 font-bold text-sm mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Integrations */}
          {related.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">
                Related Integrations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/integrations/${rel.slug}`}
                    className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 hover:border-violet-600/40 hover:bg-slate-900/70 transition-all duration-200"
                  >
                    <span className="text-2xl mb-2 block" role="img" aria-label={rel.service}>
                      {rel.icon}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">
                      {rel.service}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {rel.metaDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section>
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-10 text-center">
              <h2 className="text-2xl font-bold text-slate-100 mb-3">
                Secure your {integration.service} access
              </h2>
              <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                Set up granular permissions for your AI agents in minutes. Free
                tier includes 1 project, 5 endpoints, and 1,000 requests per
                month.
              </p>
              <Link
                href="/signup"
                className="inline-flex cursor-pointer items-center justify-center px-6 py-3 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all duration-150 shadow-lg shadow-violet-900/30"
              >
                Start free
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
