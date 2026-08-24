// Single source for the landing FAQ accordion.
export type FaqItem = { q: string; a: string };

// The one place the supported-service list is written out. Deliberately a plain
// string rather than a derivation from PROVIDER_REGISTRY: that module is 1k+
// lines and this one is imported by a client component. `faq.test.ts` asserts
// the leading count still matches the registry, so adding a provider fails CI
// until this sentence is updated.
export const INTEGRATIONS_SENTENCE =
  "27 services: Gmail, Google Calendar, Google Drive, Google Ads, Google Search Console, " +
  "Google Tag Manager, YouTube, Slack, Notion, GitHub, Jira, Salesforce, HubSpot, Airtable, " +
  "Calendly, Stripe, Telegram, X/Twitter, X/Twitter Ads, LinkedIn, Meta Ads, Instagram, " +
  "Threads, Ahrefs, Semrush, OpenRouter and generic email over IMAP/SMTP.";

export const LANDING_FAQ: FaqItem[] = [
  {
    q: "What is MCP and why does it need a permission layer?",
    a: "MCP (Model Context Protocol) is Anthropic's open standard that lets AI agents call external tools — read files, send emails, query databases. By design, MCP servers request broad OAuth scopes with no built-in mechanism to restrict access per agent. ScopeGate sits in front of your MCP servers and enforces fine-grained, per-agent permissions so each agent can only do exactly what it's supposed to.",
  },
  {
    q: "How is ScopeGate different from just using OAuth scopes directly?",
    a: "OAuth scopes are binary: an app either has access or it doesn't. ScopeGate adds a second layer on top — every individual action is a separate toggle, and everything is off until you switch it on. List and read Drive files but never delete. Send Gmail but never read the inbox. Read the calendar but never write to it. Each endpoint also carries its own requests-per-minute limit, and revoking an agent is one click that takes effect immediately, without touching OAuth at all.",
  },
  {
    q: "Does my data pass through ScopeGate's servers?",
    a: "On ScopeGate Cloud, yes — ScopeGate acts as a transparent proxy. Tool call requests from your agent route through our infrastructure, are checked against your permission policy, and forwarded to the target service. We log metadata (action, params, status, duration) but do not store the actual payload contents. Self-host it and nothing leaves your own infrastructure.",
  },
  {
    q: "Can I self-host ScopeGate?",
    a: "Yes. The core ScopeGate engine is open-source (MIT license) and available at github.com/alifanov/scopegate. You can run it yourself with no usage limits. ScopeGate Cloud adds hosted reliability, managed upgrades and paid plans on top of the same codebase. Self-hosting instructions are in the repository README.",
  },
  {
    q: "What integrations are supported today?",
    a: `${INTEGRATIONS_SENTENCE} We add new integrations every few weeks — request one on GitHub if yours is missing.`,
  },
  {
    q: "Is ScopeGate SOC 2 compliant?",
    a: "We are actively pursuing SOC 2 Type II certification (expected Q3 2026). Enterprise customers receive a copy of our security questionnaire responses, penetration test results, and data processing agreement. The audit log format is designed to support SOC 2 and EU AI Act Article 13 transparency requirements out of the box.",
  },
];
