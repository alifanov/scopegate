import { notFound } from "next/navigation";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Pricing } from "@/components/landing/pricing";
import { PricingFaq } from "@/components/landing/pricing-faq";
import { isCloud } from "@/lib/cloud";
import { publicPlans, UNLIMITED } from "@/lib/plans";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Free Plan Available, Pro from $29/mo",
  description:
    "Free plan to get started, Pro for solo developers, Team for shared governance. Simple transparent pricing for AI agent permission control.",
  alternates: { canonical: "https://scopegate.dev/pricing" },
};

export const viewport = MARKETING_VIEWPORT;

function limit(value: number, noun: string): string {
  if (value === UNLIMITED) return `unlimited ${noun}s`;
  return `${value.toLocaleString("en-US")} ${noun}${value === 1 ? "" : "s"}`;
}

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "ScopeGate",
  description:
    "AI Access Proxy Layer — granular permission gateway for AI agents using MCP.",
  url: "https://scopegate.dev",
  brand: { "@type": "Brand", name: "ScopeGate" },
  // Same source as the visible table — PLAN_REGISTRY — so the schema can't
  // advertise a price or a limit the product no longer enforces.
  offers: publicPlans()
    .filter((plan) => plan.priceMonthly !== null)
    .map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: "USD",
      priceValidUntil: "2027-01-01",
      description: [
        limit(plan.limits.projects, "project"),
        limit(plan.limits.endpoints, "endpoint"),
        limit(plan.limits.requestsPerMonth, "request") + "/month",
      ].join(", "),
      url: "https://scopegate.dev/pricing",
      availability: "https://schema.org/InStock",
    })),
};

export default function PricingPage() {
  // Paid plans only exist on the hosted offering; a self-hosted instance is
  // unlimited and free, so advertising tiers there would be misleading.
  if (!isCloud()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-4 text-center px-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tight leading-tight">
            Simple, transparent pricing
            <br />
            <span className="text-slate-500">that scales with your agents</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            Start free with no credit card. Upgrade when your agents are ready
            for production.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <Pricing />

      {/* Trust signals */}
      <section className="py-12 border-t border-slate-800/40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              {
                title: "No surprise overages",
                description: "We reject requests once you hit your limit — we never charge you extra.",
              },
              {
                title: "Cancel anytime",
                description: "Month-to-month by default. No lock-in, no cancellation fees.",
              },
              {
                title: "GDPR & SOC 2 ready",
                description: "Data processing agreements available for all paid plans.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-2 p-6 bg-slate-900/30 rounded-2xl border border-slate-800/40">
                <div className="text-slate-200 font-semibold text-sm">{item.title}</div>
                <p className="text-slate-500 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <PricingFaq />

      {/* CTA */}
      <section className="py-16 border-t border-slate-800/40">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-3xl font-bold text-slate-50">
            Start with the free plan today
          </h2>
          <p className="text-slate-400">
            No credit card. One project, five endpoints — live in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="inline-flex cursor-pointer items-center justify-center px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-all duration-150 shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 rounded-xl font-medium text-sm transition-all duration-150"
            >
              See all features →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
