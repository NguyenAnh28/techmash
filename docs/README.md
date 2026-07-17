# InternMash System Docs

This folder explains the main pieces of InternMash in plain technical language. Each document is named after the part of the system it covers.

Start here:

- [frontend.md](./frontend.md): routes, shared UI, layout, and the client/server split.
- [software-design.md](./software-design.md): senior-level system design, ownership boundaries, bottlenecks, and delegation plan.
- [voting.md](./voting.md): the pairwise voting flow and vote card behavior.
- [leaderboard.md](./leaderboard.md): rankings, pagination, and company detail modals.
- [algorithm.md](./algorithm.md): Elo rating behavior and vote math.
- [supabase.md](./supabase.md): database schema, RLS, RPC writes, and seeding.
- [logos.md](./logos.md): logo.dev usage, caching, and fallback behavior.
- [analytics.md](./analytics.md): first-party event tracking and the public stats page.
- [blog.md](./blog.md): the notes/blog implementation.
- [load-testing.md](./load-testing.md): leaderboard load-test commands and results.

The app is built as a Next.js App Router project with Supabase as the database. Public users can browse, vote, open company details, and view aggregate stats. Writes that change rankings go through server-side code and a database RPC so votes stay consistent.
