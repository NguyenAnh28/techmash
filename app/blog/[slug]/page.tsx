import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type BlogBodyBlock, blogPosts, getBlogPost } from "@/lib/blog";

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function isFormulaBlock(
  block: BlogBodyBlock,
): block is Extract<BlogBodyBlock, { type: "formula" }> {
  return typeof block === "object" && block.type === "formula";
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Blog | InternMash",
    };
  }

  return {
    title: `${post.title} | InternMash`,
    description: post.summary,
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="bg-white">
      <article className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6 lg:py-24">
        <Link
          href="/blog"
          className="group mb-16 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-slate-400 transition-colors hover:text-black"
        >
          <span
            aria-hidden="true"
            className="text-base transition-transform duration-200 group-hover:-translate-x-1"
          >
            ←
          </span>
          Back to notes
        </Link>

        <header className="border-b border-slate-200 pb-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">
              {post.eyebrow} Note
            </p>
            <p className="text-base font-medium text-neutral-500">
              {post.date} · {post.readTime}
            </p>
          </div>

          <h1 className="text-5xl font-normal tracking-[-0.04em] text-black sm:text-7xl">
            {post.title}
          </h1>
          <p className="mt-8 max-w-3xl text-xl font-medium leading-8 text-neutral-500">
            {post.summary}
          </p>
        </header>

        <div className="mt-12 space-y-7">
          {post.body.map((block, index) => {
            if (isFormulaBlock(block)) {
              return (
                <figure
                  key={`${post.slug}-formula-${index}`}
                  className="my-10 rounded-3xl border border-black/[0.04] bg-neutral-50 px-5 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:px-8"
                >
                  <div className="space-y-4 overflow-x-auto font-serif text-2xl italic tracking-normal text-black sm:text-3xl">
                    {block.lines.map((line) => (
                      <p key={line} className="whitespace-nowrap">
                        {line}
                      </p>
                    ))}
                  </div>
                  <figcaption className="mx-auto mt-5 max-w-xl text-sm font-medium leading-6 text-neutral-500">
                    {block.caption}
                  </figcaption>
                </figure>
              );
            }

            return (
              <p
                key={`${post.slug}-paragraph-${index}`}
                className="text-lg font-medium leading-9 text-neutral-700"
              >
                {block}
              </p>
            );
          })}
        </div>
      </article>
    </main>
  );
}
