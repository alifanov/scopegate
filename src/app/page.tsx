import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-middleware";
import { isCloud } from "@/lib/cloud";
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

export const metadata: Metadata = {
  title: "ScopeGate — Granular AI Agent Permissions for MCP | Free",
  description:
    "Give each AI agent exactly the access it needs — nothing more. ScopeGate enforces per-agent permissions on MCP: restrict tools, scopes & data, instant revoke, full audit trail. Free plan available.",
  alternates: { canonical: "https://scopegate.dev" },
};

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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is MCP and why does it need a permission layer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MCP (Model Context Protocol) is Anthropic's open standard that lets AI agents call external tools — read files, send emails, query databases. By design, MCP servers request broad OAuth scopes with no built-in mechanism to restrict access per agent. ScopeGate sits in front of your MCP servers and enforces fine-grained, per-agent permissions so each agent can only do exactly what it's supposed to.",
      },
    },
    {
      "@type": "Question",
      name: "How is ScopeGate different from just using OAuth scopes directly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OAuth scopes are binary: an app either has access or it doesn't. ScopeGate adds a second layer on top: folder-level read restrictions within Google Drive, send-only Gmail (no read), calendar read-only per agent, rate limits per agent per service, and instant cross-service revocation without touching OAuth at all.",
      },
    },
    {
      "@type": "Question",
      name: "Does my data pass through ScopeGate's servers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On ScopeGate Cloud, yes — ScopeGate acts as a transparent proxy. Tool call requests from your agent route through our infrastructure, are checked against your permission policy, and forwarded to the target service. We log metadata (action, params, status, duration) but do not store the actual payload contents. Self-host it and nothing leaves your own infrastructure.",
      },
    },
    {
      "@type": "Question",
      name: "Can I self-host ScopeGate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ScopeGate is open-source and available at github.com/alifanov/scopegate. You can run it yourself with no usage limits. ScopeGate Cloud adds hosted reliability, managed upgrades and paid plans on top of the same codebase.",
      },
    },
    {
      "@type": "Question",
      name: "What integrations are supported today?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "26 services, including Gmail, Google Calendar, Google Drive, Google Ads, Google Search Console, Google Tag Manager, YouTube, Slack, Notion, GitHub, Jira, Salesforce, HubSpot, Airtable, Calendly, Stripe, Telegram, X/Twitter, LinkedIn, Meta Ads, Instagram, Threads, Ahrefs, Semrush and OpenRouter. We add new integrations every few weeks.",
      },
    },
  ],
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
