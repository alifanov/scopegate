"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function ScopegateIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#7c3aed" />
      <path
        d="M14 6L20 9.5V15.5C20 18.26 17.31 20.76 14 22C10.69 20.76 8 18.26 8 15.5V9.5L14 6Z"
        fill="white"
        fillOpacity="0.2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 14L13.5 16L16.5 12"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Compare", href: "/compare" },
  { label: "Glossary", href: "/glossary" },
  { label: "Blog", href: "/blog" },
  { label: "GitHub", href: "https://github.com/alifanov/scopegate" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex cursor-pointer items-center gap-2.5 group">
          <ScopegateIcon />
          <span className="font-bold text-lg text-slate-100 tracking-tight">
            ScopeGate
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer px-4 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition-all duration-150"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="cursor-pointer px-4 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition-all duration-150"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="cursor-pointer text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="cursor-pointer text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-all duration-150 font-medium shadow-lg shadow-violet-900/30"
          >
            Start free
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden cursor-pointer p-2 text-slate-400 hover:text-slate-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            {menuOpen ? (
              <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-6 py-4 space-y-1">
          {navLinks.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="block cursor-pointer px-4 py-3 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block cursor-pointer px-4 py-3 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer text-center py-2.5 text-sm text-slate-300 border border-slate-700 rounded-lg"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer text-center py-2.5 text-sm bg-violet-600 text-white rounded-lg font-medium"
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
