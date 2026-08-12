import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { blogPosts } from "@/data/blog";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — MCP Security, AI Agent Permissions & Guides | ScopeGate",
  description:
    "In-depth guides on MCP gateways, AI agent security, permission management, and best practices for securing agent access to external services.",
  alternates: { canonical: "https://scopegate.dev/blog" },
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight mb-4">
              Blog
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Guides, tutorials, and deep dives on MCP gateway security, AI
              agent permissions, and building safer agentic systems.
            </p>
          </div>

          <div className="space-y-6">
            {sorted.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all duration-150 hover:border-violet-600/40 hover:bg-violet-500/5"
              >
                <time className="text-xs text-slate-500 font-mono">
                  {post.publishedAt}
                </time>
                <h2 className="text-xl font-semibold text-slate-100 mt-1 mb-2 group-hover:text-violet-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                  {post.tldr}
                </p>
              </Link>
            ))}
          </div>

          {sorted.length === 0 && (
            <p className="text-center text-slate-500">
              No posts yet. Check back soon.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
