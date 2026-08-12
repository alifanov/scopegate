import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — ScopeGate",
  description: "How ScopeGate uses cookies and similar technologies.",
  alternates: { canonical: "https://scopegate.dev/cookies" },
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    title: "1. What Are Cookies",
    content: [
      {
        subtitle: "Definition",
        text: "Cookies are small text files placed on your device by a website. They are widely used to make websites work efficiently and to provide information to site owners.",
      },
    ],
  },
  {
    title: "2. Cookies We Use",
    content: [
      {
        subtitle: "Strictly necessary cookies",
        text: "These cookies are essential for the website to function. They include the session cookie (better-auth.session_token) used for authentication. This cookie expires when you sign out or after 30 days of inactivity. You cannot opt out of these cookies as the service will not work without them.",
      },
      {
        subtitle: "Analytics cookies",
        text: "None. We do not run client-side analytics and set no analytics or tracking cookies. Server-side telemetry (request latency, error rates) is collected without cookies and is not tied to an individual visitor.",
      },
    ],
  },
  {
    title: "3. Third-Party Cookies",
    content: [
      {
        subtitle: "No advertising cookies",
        text: "We do not use advertising or cross-site tracking cookies. No third-party ad networks place cookies on our site.",
      },
      {
        subtitle: "OAuth providers",
        text: "When you connect external services (e.g., Google, LinkedIn), the OAuth flow may temporarily involve cookies set by those providers on their own domains. ScopeGate does not control these cookies — refer to the respective provider's cookie policy.",
      },
    ],
  },
  {
    title: "4. Managing Cookies",
    content: [
      {
        subtitle: "Cookie consent",
        text: "When you first visit ScopeGate, a cookie consent banner allows you to accept or decline non-essential cookies. You can change your preference at any time by clicking the cookie icon in the bottom-left corner of the page.",
      },
      {
        subtitle: "Browser settings",
        text: "Most browsers allow you to refuse or delete cookies through their settings. Note that blocking strictly necessary cookies may prevent you from using ScopeGate.",
      },
    ],
  },
  {
    title: "5. Changes to This Policy",
    content: [
      {
        subtitle: "Updates",
        text: "We may update this Cookie Policy from time to time. Material changes will be communicated via a notice on our website.",
      },
    ],
  },
  {
    title: "6. Contact",
    content: [
      {
        subtitle: "Questions",
        text: "If you have questions about our use of cookies, please contact us at privacy@scopegate.dev.",
      },
    ],
  },
];

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
          <p className="text-slate-500 text-sm">
            Effective date: <span className="text-slate-400">March 6, 2026</span>
          </p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            This policy explains how ScopeGate (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
            uses cookies and similar technologies when you visit our website.
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
          <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
