"use client";

import { useState } from "react";

const PRICING_FAQS = [
  {
    q: "Is there really a free plan with no credit card?",
    a: "Yes. The Free plan lets you create one project with five MCP endpoints and up to 1,000 requests per month. No credit card is ever required for the free tier. You can upgrade at any time.",
  },
  {
    q: "What counts as a 'request'?",
    a: "Each tool call proxied through a ScopeGate MCP endpoint counts as one request. For example, reading a Google Drive file = 1 request; sending a Gmail = 1 request. Metadata fetches and health checks do not count.",
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes — plans are billed month-to-month (or annually if you choose). You can upgrade, downgrade, or cancel at any time from the Billing page. When you cancel, your subscription stays active until the end of the current billing period.",
  },
  {
    q: "What happens if I exceed my monthly request limit?",
    a: "Once you hit the limit, new requests are rejected with a 402 response until the next billing cycle or until you upgrade. We never silently throttle or bill you for overages.",
  },
  {
    q: "Do you offer discounts for startups or open-source projects?",
    a: "Yes. Email us at hello@scopegate.dev with a brief description of your project. We offer 50% off for qualifying open-source projects and early-stage startups (under $1M ARR).",
  },
  {
    q: "What is included in the Enterprise plan?",
    a: "Everything in Team, plus: unlimited endpoints and requests, custom retention policies, SOC 2 Type II report access, EU AI Act compliance package, SLA guarantee, dedicated Slack channel, custom integrations, and on-prem/VPC deployment. Contact hello@scopegate.dev for a quote.",
  },
  {
    q: "Is annual billing available for all plans?",
    a: "Annual billing is available for Pro and Team plans. You save 20% compared to monthly billing. The Free and Enterprise plans are not affected by the billing cycle toggle.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PricingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 border-t border-slate-800/40">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em] mb-3">
            FAQ
          </p>
          <h2 className="text-3xl font-bold text-slate-50">
            Pricing questions answered
          </h2>
        </div>

        <div className="space-y-2">
          {PRICING_FAQS.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left text-sm font-medium text-slate-200 hover:text-slate-100 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronIcon open={open === i} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === i ? "max-h-60" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-4">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Still have questions?{" "}
          <a
            href="mailto:hello@scopegate.dev"
            className="text-violet-500 hover:text-violet-400 transition-colors"
          >
            Email us →
          </a>
        </p>
      </div>
    </section>
  );
}
