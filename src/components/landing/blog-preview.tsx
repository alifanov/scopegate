import Link from "next/link";
import { blogPosts } from "@/data/blog";

export function BlogPreview() {
  const sorted = [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <section className="py-20 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            Latest from the blog
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Guides on MCP security, AI agent permissions, and building safer
            agentic systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all duration-150 hover:border-violet-600/40 hover:bg-violet-500/5"
            >
              <time className="text-xs text-slate-400 font-mono">
                {post.publishedAt}
              </time>
              <h3 className="text-lg font-semibold text-slate-100 mt-1 mb-2 group-hover:text-violet-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                {post.tldr}
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View all posts
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="mt-px"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
