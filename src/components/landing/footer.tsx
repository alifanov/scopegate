import Link from "next/link";

const NAV_LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Integrations", href: "/integrations" },
    { label: "Pricing", href: "/pricing" },
    { label: "Compare", href: "/compare" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "Glossary", href: "/glossary" },
    { label: "GitHub", href: "https://github.com/alifanov/scopegate" },
    { label: "Request integration", href: "https://github.com/alifanov/scopegate/issues" },
  ],
  Company: [
    { label: "Blog", href: "/blog" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Cookie policy", href: "/cookies" },
  ],
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-700/40 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-violet-400">
          <path d="M8 1.5L14 4.5v4c0 3.5-2.8 5.5-6 6.5-3.2-1-6-3-6-6.5v-4L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-slate-200 font-semibold tracking-tight">Scopegate</span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        {/* top row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* brand column */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Logo />
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              The permission proxy between your AI agents and the external services they access.
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Open-core · Self-hostable · Developer-first
            </p>
            {/* social links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/alifanov/scopegate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/scopegate_cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="Twitter / X"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* nav columns */}
          {Object.entries(NAV_LINKS).map(([group, links]) => (
            <div key={group} className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.1em]">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom row */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Scopegate. All rights reserved.
          </p>
          <p className="text-xs text-slate-700">
            Built with Next.js · Deployed on Vercel · MIT licensed core
          </p>
        </div>
      </div>
    </footer>
  );
}
