"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "What is MCP and why does it need a permission layer?",
    a: "MCP (Model Context Protocol) is Anthropic's open standard that lets AI agents call external tools — read files, send emails, query databases. By design, MCP servers request broad OAuth scopes with no built-in mechanism to restrict access per agent. Scopegate sits in front of your MCP servers and enforces fine-grained, per-agent permissions so each agent can only do exactly what it's supposed to.",
  },
  {
    q: "How is Scopegate different from just using OAuth scopes directly?",
    a: "OAuth scopes are binary: an app either has access or it doesn't. Scopegate adds a second layer on top: folder-level read restrictions within Google Drive, send-only Gmail (no read), calendar read-only per agent, rate limits per agent per service, and instant cross-service revocation without touching OAuth at all. You get granular control that OAuth alone can't provide.",
  },
  {
    q: "Does my data pass through Scopegate's servers?",
    a: "Yes — Scopegate acts as a transparent proxy. Tool call requests from your agent route through our infrastructure, are checked against your permission policy, and forwarded to the target service. The response is returned to your agent. We log metadata (action, params, status, duration) but do not store the actual payload contents. Enterprise customers can opt for VPC deployment to keep all traffic within their own infrastructure.",
  },
  {
    q: "Can I self-host Scopegate?",
    a: "Yes. The core Scopegate engine is open-source (MIT license) and available at github.com/alifanov/scopegate. You can run it yourself with no usage limits. Scopegate Cloud adds multi-tenancy, team management, SSO, compliance exports, and hosted reliability on top. Self-hosting documentation is at /docs/self-hosting.",
  },
  {
    q: "What integrations are supported today?",
    a: "Currently: Google Drive, Gmail, Google Calendar, Google Sheets, Slack, Notion, GitHub, Twitter/X, LinkedIn, Google Ads, and OpenRouter. We're adding new integrations every few weeks. Each integration is an MCP endpoint — if you need one that isn't listed, you can request it on GitHub or implement a custom connector using our SDK.",
  },
  {
    q: "Is Scopegate SOC 2 compliant?",
    a: "We are actively pursuing SOC 2 Type II certification (expected Q3 2026). Enterprise customers receive a copy of our security questionnaire responses, penetration test results, and data processing agreement. The audit log format is designed to support SOC 2 and EU AI Act Article 13 transparency requirements out of the box.",
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

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28">
      <div className="max-w-3xl mx-auto px-6">
        {/* header */}
        <div className="text-center space-y-4 mb-14">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-[0.15em]">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50">
            Common questions
          </h2>
        </div>

        {/* accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
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
                  open === i ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-4">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 space-y-2">
          <Link
            href="/glossary"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Browse the MCP & AI security glossary
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-px">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-slate-600">
            Still have questions?{" "}
            <a href="mailto:hello@scopegate.cloud" className="text-violet-600 hover:text-violet-400 transition-colors">
              Email us →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
