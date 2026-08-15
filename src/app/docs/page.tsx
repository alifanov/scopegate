import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { INTEGRATIONS_SENTENCE } from "@/data/faq";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — How to Set Up Your MCP Proxy & AI Agent Permissions",
  description:
    "Learn how ScopeGate works as an MCP proxy layer. Set up per-agent permissions, audit trails, and rate limiting for AI agents accessing Google, Slack, GitHub, and more.",
  alternates: { canonical: "https://scopegate.dev/docs" },
};

const sections = [
  {
    id: "what-is-scopegate",
    title: "What is ScopeGate?",
    content:
      "ScopeGate is an AI Access Proxy Layer that sits between your AI agents and the external services they use. It enforces granular, per-agent permissions on top of MCP (Model Context Protocol) and OAuth \u2014 so each agent can only do exactly what you authorize.",
  },
  {
    id: "mcp-proxy",
    title: "How the MCP Proxy Works",
    content:
      "When an AI agent makes a tool call via MCP, the request routes through ScopeGate before reaching the target service. ScopeGate checks the request against your permission policy: which agent is calling, what action it\u2019s requesting, and whether that action is allowed. If the request passes, it\u2019s forwarded transparently. If not, it\u2019s blocked and logged.",
  },
  {
    id: "per-agent-permissions",
    title: "Per-Agent Permission Control",
    content:
      "Unlike native OAuth scopes (which are binary \u2014 an app either has access or it doesn\u2019t), ScopeGate lets you define fine-grained rules per agent. For example: Agent A can read Google Drive files in the /reports folder but can\u2019t write. Agent B can send Gmail but can\u2019t read your inbox. Agent C has read-only Google Calendar access with a rate limit of 100 requests per hour.",
  },
  {
    id: "audit-trails",
    title: "Audit Trails & Logging",
    content:
      "Every tool call that passes through ScopeGate is logged with metadata: which agent, what action, parameters, status, and duration. You get a full audit trail of what your AI agents are doing across all connected services \u2014 essential for compliance, debugging, and trust.",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    steps: [
      "Sign up for a free ScopeGate account",
      "Create a project and connect your first service (e.g., Google)",
      "Define permission rules for your AI agent",
      "Copy the MCP endpoint URL into your agent\u2019s configuration",
      "Your agent now accesses the service through ScopeGate\u2019s permission layer",
    ],
    code: `{
  "mcpServers": {
    "scopegate": {
      "url": "https://scopegate.dev/api/mcp/sg_your_endpoint_key"
    }
  }
}`,
  },
  {
    id: "integrations",
    title: "Supported Integrations",
    content:
      `ScopeGate supports ${INTEGRATIONS_SENTENCE} New integrations are added regularly.`,
  },
  {
    id: "self-hosting",
    title: "Self-Hosting",
    content:
      "The core ScopeGate engine is open-source (MIT license) and available on GitHub. You can run it yourself with no usage limits. ScopeGate Cloud adds hosted reliability, managed upgrades and paid plans on top of the same codebase.",
    code: `git clone https://github.com/alifanov/scopegate.git
cd scopegate
docker compose --profile local up`,
    link: {
      href: "https://github.com/alifanov/scopegate",
      label: "github.com/alifanov/scopegate",
    },
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-lg text-slate-400 mb-12">
          Everything you need to set up ScopeGate as your MCP proxy and
          configure per-agent permissions for your AI agents.
        </p>

        <nav className="mb-12 p-4 bg-slate-900 rounded-lg border border-slate-800">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            On this page
          </h2>
          <ul className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            {section.content && (
              <p className="text-slate-300 leading-relaxed">
                {section.content}
              </p>
            )}
            {"steps" in section && section.steps && (
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {"code" in section && section.code && (
              <pre className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto text-sm text-slate-200">
                <code>{section.code}</code>
              </pre>
            )}
            {"link" in section && section.link && (
              <a
                href={section.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {section.link.label} →
              </a>
            )}
          </section>
        ))}

        <div className="mt-16 p-6 bg-slate-900 rounded-lg border border-slate-800 text-center">
          <h2 className="text-xl font-semibold mb-2">Ready to get started?</h2>
          <p className="text-slate-400 mb-4">
            Create a free account and set up your first MCP proxy in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-block cursor-pointer px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/30"
          >
            Create a free account
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
