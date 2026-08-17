"use client";

import { useState } from "react";
import Link from "next/link";
import { publicPlans, UNLIMITED } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mt-0.5">
      <path d="M2.5 7.5l3.5 3.5 5.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Prices, limits and descriptions come from PLAN_REGISTRY so the advertised
// numbers are literally the enforced ones. Only the copy that has no home in the
// registry — CTA label, badge, feature bullets — lives here, keyed by slug.
const TIER_COPY: Record<
  string,
  { cta: string; ctaHref: string; highlight: boolean; badge: string | null; extras: string[] }
> = {
  free: {
    cta: "Start free",
    ctaHref: "/signup",
    highlight: false,
    badge: null,
    extras: ["Every integration included", "Audit log of every tool call", "Community support"],
  },
  pro: {
    cta: "Start Pro trial",
    ctaHref: "/signup?plan=pro",
    highlight: false,
    badge: null,
    extras: ["Every integration included", "Rate limit per endpoint", "Email support"],
  },
  team: {
    cta: "Start Team trial",
    ctaHref: "/signup?plan=team",
    highlight: true,
    badge: "Most popular",
    extras: [
      "Every integration included",
      "Shared projects for your team",
      "Rate limit per endpoint",
      "Priority support",
    ],
  },
  enterprise: {
    cta: "Contact sales",
    ctaHref: "mailto:hello@scopegate.dev",
    highlight: false,
    badge: null,
    extras: [
      "SOC 2 Type II report",
      "EU AI Act compliance package",
      "SLA guarantee",
      "Dedicated Slack channel",
      "Custom integrations",
      "On-prem / VPC deployment",
    ],
  },
};

function limitLine(value: number, unlimited: string, one: string, many: string): string {
  if (value === UNLIMITED) return unlimited;
  return value === 1 ? `${value} ${one}` : `${value.toLocaleString("en-US")} ${many}`;
}

const TIERS = publicPlans().map((plan) => {
  const copy = TIER_COPY[plan.slug];
  return {
    name: plan.name,
    price: { monthly: plan.priceMonthly, yearly: plan.priceYearly },
    description: plan.description,
    ...copy,
    features: [
      limitLine(plan.limits.projects, "Unlimited projects", "project", "projects"),
      limitLine(plan.limits.endpoints, "Unlimited MCP endpoints", "MCP endpoint", "MCP endpoints"),
      limitLine(
        plan.limits.requestsPerMonth,
        "Unlimited requests / month",
        "request / month",
        "requests / month",
      ),
      ...copy.extras,
    ],
  };
});

// Only pro/team CTAs carry a plan param — appending billing there lets /signup
// show the same period the visitor just picked here (Task #249).
function ctaHref(href: string, annual: boolean): string {
  if (!annual || !href.includes("plan=")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}billing=annual`;
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-12">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
            Simple, transparent pricing
            <br />
            <span className="text-slate-400">that scales with your agents</span>
          </h2>
        </div>

        {/* billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <span className={`text-sm ${!annual ? "text-slate-200" : "text-slate-400"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${annual ? "bg-violet-600" : "bg-slate-700"}`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${annual ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-slate-200" : "text-slate-400"}`}>
            Annual
            <span className="ml-1.5 text-xs text-emerald-400 font-medium">save 20%</span>
          </span>
        </div>

        {/* tiers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-7 flex flex-col gap-6 transition-all duration-200 ${
                tier.highlight
                  ? "border-violet-600/60 bg-gradient-to-b from-violet-950/50 to-slate-900 shadow-2xl shadow-violet-950/40 scale-[1.02]"
                  : "border-slate-800/60 bg-slate-900/50 hover:border-slate-700/60"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-violet-600 text-white rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-100">{tier.name}</h3>
                <div className="flex items-end gap-1">
                  {tier.price.monthly === null ? (
                    <span className="text-3xl font-bold text-slate-50">Custom</span>
                  ) : tier.price.monthly === 0 ? (
                    <span className="text-3xl font-bold text-slate-50">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-slate-50">
                        ${annual ? tier.price.yearly : tier.price.monthly}
                      </span>
                      <span className="text-slate-400 text-sm mb-1">/mo</span>
                    </>
                  )}
                </div>
                {tier.price.monthly !== null && tier.price.monthly !== 0 && annual && (
                  <p className="text-xs text-emerald-400">Billed annually</p>
                )}
                <p className="text-xs text-slate-400 leading-relaxed">{tier.description}</p>
              </div>

              <a
                href={ctaHref(tier.ctaHref, annual)}
                className={`block cursor-pointer text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  tier.highlight
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30"
                    : tier.name === "Enterprise"
                    ? "border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-100"
                }`}
              >
                {tier.cta}
              </a>

              <ul className="space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 space-y-2">
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Compare ScopeGate with alternatives
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-px">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-slate-400">
            All plans include TLS encryption, encrypted credential storage, and GDPR-compliant data
            handling. A contractual uptime SLA is part of the Enterprise plan.
            <br />
            <a
              href="https://github.com/alifanov/scopegate#self-hosting"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-violet-600 hover:text-violet-400 transition-colors"
            >
              Prefer to self-host? →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
