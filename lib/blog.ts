export interface BlogPost {
  slug: string;
  eyebrow: string;
  title: string;
  date: string;
  readTime: string;
  summary: string;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "pairwise-voting-internship-preference",
    eyebrow: "Problem",
    title: "Why pairwise voting works for internship preference",
    date: "July 2026",
    readTime: "3 min read",
    summary:
      "Internship advice is scattered across group chats, spreadsheets, and old posts. InternMash turns preference into a fast comparison loop.",
    body: [
      "Choosing a tech internship is rarely just about brand name. Students weigh mentorship, pay, housing, project quality, return offer odds, and whether the work sounds like something they actually want to do every day.",
      "The problem is that most of those signals are fragmented. A single ranked list feels too rigid, while long reviews are hard to compare quickly. Pairwise voting gives people a lower-friction question: between these two options, where would you rather intern?",
      "That voting style lets the leaderboard emerge from many small judgments instead of one giant form. Elo then gives each vote a measured effect, so beating a highly rated company matters more than beating a low-rated one.",
    ],
  },
  {
    slug: "elo-atomic-writes-logo-cleanup",
    eyebrow: "Implementation",
    title: "The first build: Elo, atomic writes, and logo cleanup",
    date: "July 2026",
    readTime: "4 min read",
    summary:
      "The MVP keeps the stack simple: Next.js Server Actions, Supabase Postgres, and a small Elo engine with careful vote writes.",
    body: [
      "The backend is intentionally compact. Next.js Server Actions handle fetching matchups and recording votes, while Supabase Postgres stores the companies and current rankings.",
      "The most important implementation choice is that vote recording happens inside one Postgres function. That function locks both company rows, calculates both new Elo ratings, increments the counters, and commits the result together. That avoids mismatched ratings when multiple people vote at the same time.",
      "The visual layer had its own small problem: company logos come from a remote SVG library, and some default logos are white. On a white interface, they disappear. The current setup stores a logo variant in the seed data and includes an audit script to catch invisible assets before they ship.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
