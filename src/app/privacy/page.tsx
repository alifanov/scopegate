import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";
import { MARKETING_VIEWPORT } from "@/lib/marketing-viewport";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ScopeGate",
  description: "How ScopeGate collects, uses, and protects your personal information.",
  alternates: { canonical: "https://scopegate.dev/privacy" },
  robots: { index: false, follow: false },
};

export const viewport = MARKETING_VIEWPORT;

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Account information",
        text: "When you register, we collect your email address and, optionally, a display name. Passwords are hashed with bcrypt and never stored in plain text.",
      },
      {
        subtitle: "OAuth tokens",
        text: "When you connect external services (e.g., Google), we store the OAuth access and refresh tokens required to act on your behalf. These tokens are encrypted at rest and never exposed via the API.",
      },
      {
        subtitle: "Usage data",
        text: "We collect anonymised analytics (page views, feature usage) via Plausible Analytics — a privacy-first, GDPR-compliant tool that does not use cookies and does not track individuals across sites.",
      },
      {
        subtitle: "Request logs",
        text: "MCP endpoint requests are logged for audit and debugging purposes. Logs include timestamps, tool names, and status codes. Request payloads are not logged by default.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      {
        subtitle: "Service operation",
        text: "We use your account information to authenticate you, route MCP requests to the correct permissions context, and deliver the service.",
      },
      {
        subtitle: "Transactional emails",
        text: "We may send you magic-link sign-in emails, security alerts, and billing receipts. We do not send marketing emails without your explicit consent.",
      },
      {
        subtitle: "Product improvement",
        text: "Aggregated, anonymised usage statistics help us prioritise features and fix bugs.",
      },
    ],
  },
  {
    title: "3. Data Sharing",
    content: [
      {
        subtitle: "No sale of personal data",
        text: "We do not sell, rent, or trade your personal information to any third party.",
      },
      {
        subtitle: "Sub-processors",
        text: "We rely on a small number of sub-processors to operate the service: Vercel (hosting), Neon / Supabase (database), and Resend (transactional email). Each sub-processor is bound by a data processing agreement.",
      },
      {
        subtitle: "Legal requirements",
        text: "We may disclose information if required by law or to protect the rights and safety of ScopeGate, its users, or the public.",
      },
    ],
  },
  {
    title: "4. Data Retention",
    content: [
      {
        subtitle: "Account data",
        text: "We retain your account data for as long as your account is active. You may delete your account at any time from the Settings page; account data is permanently deleted within 30 days.",
      },
      {
        subtitle: "Audit logs",
        text: "Request audit logs are retained for 90 days on the free plan and 365 days on paid plans.",
      },
    ],
  },
  {
    title: "5. Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is transmitted over TLS 1.2+. OAuth tokens and sensitive credentials are encrypted at rest using AES-256.",
      },
      {
        subtitle: "Access control",
        text: "Production database access is restricted to our deployment pipeline. No engineer has standing access to production data.",
      },
      {
        subtitle: "Vulnerability disclosure",
        text: "If you discover a security vulnerability, please report it to security@scopegate.dev. We follow a 90-day coordinated disclosure policy.",
      },
    ],
  },
  {
    title: "6. Your Rights",
    content: [
      {
        subtitle: "Access and portability",
        text: "You may request a copy of all personal data we hold about you by emailing privacy@scopegate.dev.",
      },
      {
        subtitle: "Correction and deletion",
        text: "You may update your profile at any time from the Settings page, or request deletion of your account and all associated data.",
      },
      {
        subtitle: "GDPR / CCPA",
        text: "If you are a resident of the European Economic Area or California, you have additional rights under GDPR and CCPA respectively. Contact us at privacy@scopegate.dev to exercise these rights.",
      },
    ],
  },
  {
    title: "7. Cookies",
    content: [
      {
        subtitle: "Session cookies",
        text: "We set a single session cookie (better-auth.session_token) that is strictly necessary for authentication. This cookie expires when you sign out or after 30 days of inactivity.",
      },
      {
        subtitle: "No tracking cookies",
        text: "We do not use advertising or cross-site tracking cookies. Our analytics provider (Plausible) does not use cookies.",
      },
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      {
        subtitle: "Notification",
        text: "We will notify registered users by email at least 14 days before any material change to this Privacy Policy takes effect.",
      },
    ],
  },
  {
    title: "9. Contact",
    content: [
      {
        subtitle: "Privacy inquiries",
        text: "For any questions about this Privacy Policy or our data practices, please contact us at privacy@scopegate.dev.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm">
            Effective date: <span className="text-slate-400">March 2, 2026</span>
          </p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            ScopeGate (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and the
            choices you have.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-200 mb-4 pb-2 border-b border-slate-800">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <h3 className="text-sm font-medium text-slate-300 mb-1">
                      {item.subtitle}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-sm">
          <p className="text-slate-600">
            Questions?{" "}
            <a href="mailto:privacy@scopegate.dev" className="text-violet-400 hover:text-violet-300 transition-colors">
              privacy@scopegate.dev
            </a>
          </p>
          <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">
            Terms of Service →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
