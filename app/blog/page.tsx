import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | InternMash",
  description:
    "Short notes on the internship ranking problem, implementation choices, and product tradeoffs behind InternMash.",
};

export default function BlogPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center sm:px-6 lg:pb-20 lg:pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">
          Notes
        </p>
        <h1 className="mx-auto mt-5 max-w-5xl text-5xl font-normal tracking-[-0.04em] text-black sm:text-6xl lg:text-7xl">
          Field notes for ranking internships.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-7 text-neutral-500 sm:text-xl sm:leading-8">
          Product decisions, build progress, and the small things we learn while
          making InternMash sharper.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-6">
        {blogPosts.map((post) => (
          <Link
            key={post.title}
            href={`/blog/${post.slug}`}
            className="group grid gap-6 border-t border-slate-200 py-9 transition-colors last:border-b hover:border-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 md:grid-cols-[0.3fr_1fr_auto] md:items-center"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
                {post.eyebrow} Note
              </p>
              <p className="mt-5 text-sm font-medium text-neutral-500">
                {post.date} · {post.readTime}
              </p>
            </div>

            <div>
              <h2 className="max-w-2xl text-3xl font-normal tracking-[-0.035em] text-black sm:text-4xl">
                {post.title}
              </h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-neutral-500">
                {post.summary}
              </p>
            </div>

            <span className="flex items-center gap-3 text-sm font-bold text-black md:justify-self-end">
              Read
              <span
                className="text-xl transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
