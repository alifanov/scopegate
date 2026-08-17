import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { glossaryEntries } from "@/data/glossary";
import Link from "next/link";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";

export const metadata: Metadata = {
  title: "MCP & AI Agent Security Glossary",
  description:
    "Learn the key concepts behind MCP gateways, AI agent permissions, OAuth for MCP, audit trails, and agentic AI security. Plain-English definitions with technical depth.",
  alternates: { canonical: "https://scopegate.dev/glossary" },
};

export const viewport = MARKETING_VIEWPORT;

export default function GlossaryPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight mb-4">
              MCP &amp; AI Agent Security Glossary
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to understand about securing AI agents, the
              Model Context Protocol, and the tools that govern agent access to
              external services.
            </p>
          </div>

          {/* Term grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {glossaryEntries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/glossary/${entry.slug}`}
                className="group block rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all duration-150 hover:border-violet-600/40 hover:bg-violet-500/5"
              >
                <h2 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-violet-400 transition-colors">
                  {entry.term}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                  {entry.tldr}
                </p>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-xl border border-violet-600/30 bg-violet-500/5 p-10">
            <h2 className="text-2xl font-bold text-slate-100 mb-3">
              Secure your AI agents today
            </h2>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              ScopeGate gives you per-agent permissions, real-time audit trails,
              and instant credential revocation for every MCP connection.
            </p>
            <Link
              href="/signup"
              className="inline-block cursor-pointer text-sm bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
            >
              Start free
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
