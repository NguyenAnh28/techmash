export interface BlogFormulaBlock {
  type: "formula";
  lines: string[];
  caption: string;
}

export type BlogBodyBlock = string | BlogFormulaBlock;

export interface BlogPost {
  slug: string;
  eyebrow: string;
  title: string;
  date: string;
  readTime: string;
  summary: string;
  body: BlogBodyBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "leaderboard-snapshots-cut-repeated-work",
    eyebrow: "Performance",
    title: "How cached snapshots made the leaderboard cheaper to serve",
    date: "July 14, 2026",
    readTime: "4 min read",
    summary:
      "I found out the first leaderboard was honest but expensive: every request asked the database to sort rankings again. So I rebuilt it around five-minute snapshots.",
    body: [
      "I started with the straightforward version of the leaderboard. Every time someone opened the page, the app asked Supabase for the latest companies, sorted them by Elo rating, and returned the current page. It was easy to understand, and for an MVP it was a good first move.",
      "But once I load tested it, the weakness was obvious. The database was doing the same sorted read again and again, even when the leaderboard had barely changed. At 50 to 1000 concurrent requests, the direct version stayed around 19 to 22 requests per second, and the median latency got painfully high.",
      "So I changed the design. Votes still update ratings immediately through the atomic Postgres function, but the public leaderboard now reads from a cached snapshot. That snapshot refreshes on clean five-minute windows. If someone opens the page at 2:24, they are looking at the 2:20 snapshot, and the next window is 2:25.",
      "I also added a countdown to make that tradeoff visible. I did not want the page to pretend it was live every second when it is actually snapshot-based. When the window is ready, the user can refresh rankings manually. I also avoided auto-refreshing every open tab at the same moment, because that would create a traffic spike for no real product value.",
      "The result was one of those satisfying backend moments where a small architecture change makes the whole thing feel calmer. The cached version handled hundreds of requests per second locally, and median latency dropped by roughly 94 to 96 percent. Local tests are not production truth, but they taught me the right lesson: if a result can be shared safely for a few minutes, do not make the database rebuild it for every visitor.",
    ],
  },
  {
    slug: "pairwise-voting-internship-preference",
    eyebrow: "Problem",
    title: "Why pairwise voting works for internship preference",
    date: "July 13, 2026",
    readTime: "3 min read",
    summary:
      "I kept seeing internship advice scattered across group chats, spreadsheets, and old posts. InternMash is my attempt to turn that messy preference data into a fast comparison loop.",
    body: [
      "I wanted InternMash to start from a very normal student problem: choosing an internship has so many factors to it. I care about brand name, mentorship, pay, housing, project quality, return offer odds, and whether the work sounds like something I would actually want to do every day.",
      "The annoying part is that the useful signals are scattered everywhere. Some of it lives in spreadsheets, some in Discord messages, and some in random posts that are hard to compare. A single ranked list feels too rigid, while long reviews take too much energy when I am just trying to explore.",
      "Pairwise voting felt like the cleanest first version. Instead of asking someone to rank hundreds of companies, I ask a smaller question: between these two programs, where would you rather intern? That feels closer to how students actually talk. We compare two options, explain the vibe quickly, and move on.",
      "I also did not want the vote cards to be empty brand-name fights. The current cards show a logo, hourly pay, report count, location, and a short internship detail from the CSV dataset. The data is not perfect, but it gives people a little more context before they click.",
      "Elo is the part that turns all of those small choices into a ranking. A win against a highly rated company matters more than a win against a lower rated one, so the leaderboard can grow out of many tiny judgments instead of one giant survey. That feels like a good shape for this project.",
    ],
  },
  {
    slug: "elo-atomic-writes-logo-cleanup",
    eyebrow: "Implementation",
    title: "The first build: Elo, atomic writes, and logo cleanup",
    date: "July 13, 2026",
    readTime: "4 min read",
    summary:
      "I kept the MVP stack simple: Next.js Server Actions, Supabase Postgres, and a small Elo engine with careful vote writes.",
    body: [
      "For the first real build, I tried to keep the backend compact enough that I could still understand every moving part. Next.js Server Actions fetch matchups and record votes. Supabase Postgres stores company rows, internship metadata, current Elo ratings, and anonymous analytics events.",
      "The most important implementation choice was the vote write path. I did not want a vote to be two loose update calls from the browser. The server calls one Postgres function, `record_company_vote`, and that function locks both company rows before calculating the new ratings. That means concurrent votes do not quietly overwrite each other.",
      "The ranking algorithm is Elo. I liked it here because the formula is small enough to understand, but it still gives each matchup context. If a lower rated company beats a higher rated one, the rating move is larger. If the expected favorite wins, the move is smaller.",
      {
        type: "formula",
        lines: [
          "E = 1 / (1 + 10^((R_other - R_old) / 400))",
          "R_new = R_old + K(S - E)",
        ],
        caption:
          "E is the expected score, S is the actual result, and K is 32 in this app.",
      },
      "For example, if two companies both start at 1200, the expected score is 0.5 for each side. If one wins, its new rating becomes 1200 + 32(1 - 0.5), which is 1216. The loser becomes 1200 + 32(0 - 0.5), which is 1184. That small change is enough to move the leaderboard without letting one vote completely dominate it.",
      "I also moved the company data into `data/internships.csv`. Each row carries the company name, domain, hourly pay, report count, location text, and a short internship detail. The seed script handles cleanup too, like removing companies I do not want in the app and overriding domains when logo lookup needs help.",
      "The logo system took more tinkering than I expected. I started with remote logo links, then moved to domain-based logo.dev images. Now the frontend asks for a logo based on the company domain. If a company needs a different logo domain or a darker background, I store those overrides in Supabase. If the logo still fails, the UI falls back to a clean initial badge instead of showing a broken image.",
      "The thing I am learning is that simple architecture is not the same thing as careless architecture. This app is still small, but vote writes are atomic, logos fail gracefully, and the data pipeline can be rerun without hand-editing hundreds of companies. That is the kind of boring reliability I want to get better at building.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
