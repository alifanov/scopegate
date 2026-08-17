import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-middleware";
import { isCloud } from "@/lib/cloud";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { DemoVideo } from "@/components/landing/demo-video";
import { StatsBar } from "@/components/landing/stats-bar";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Integrations } from "@/components/landing/integrations";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { BlogPreview } from "@/components/landing/blog-preview";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { LANDING_FAQ } from "@/data/faq";

export const metadata: Metadata = {
  title: "ScopeGate — Granular AI Agent Permissions for MCP | Free",
  description:
    "Give each AI agent exactly the access it needs — nothing more. ScopeGate enforces per-agent permissions on MCP: restrict tools, scopes & data, instant revoke, full audit trail. Free plan available.",
  alternates: { canonical: "https://scopegate.dev" },
};

export const viewport = MARKETING_VIEWPORT;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ScopeGate",
  url: "https://scopegate.dev",
  logo: "https://scopegate.dev/logo.png",
  description: "AI Access Proxy Layer — granular permission gateway for AI agents",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@scopegate.dev",
    contactType: "customer support",
  },
  sameAs: ["https://github.com/alifanov/scopegate"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ScopeGate",
  url: "https://scopegate.dev",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ScopeGate",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://scopegate.dev",
  description:
    "AI Access Proxy Layer — connect external services, define granular permissions, and expose MCP endpoints for AI agents.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available — 1 project, 5 endpoints, 1K req/mo",
  },
};

// Built from the same array the <Faq> accordion renders, so the schema can never
// again claim something the visible page doesn't say.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LANDING_FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default async function HomePage() {
  // Self-hosted keeps the original behaviour: the root path is a doorway to the
  // dashboard, not a marketing site.
  if (!isCloud()) {
    const user = await getCurrentUser();
    redirect(user ? "/projects" : "/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <Hero />
      <DemoVideo />
      <StatsBar />
      <Problem />
      <HowItWorks />
      <Features />
      <Integrations />
      <Pricing />
      <div className="text-center -mt-20 pb-10">
        <Link
          href="/pricing"
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          See full pricing page with FAQ →
        </Link>
      </div>
      <Faq />
      <BlogPreview />
      <CtaSection />
      <Footer />
    </div>
  );
}
