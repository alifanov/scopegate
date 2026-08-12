"use client";

import { useState } from "react";
import Link from "next/link";
import { LANDING_FAQ as FAQS } from "@/data/faq";

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
            <a href="mailto:hello@scopegate.dev" className="cursor-pointer text-violet-600 hover:text-violet-400 transition-colors">
              Email us →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
