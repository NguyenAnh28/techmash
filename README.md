<p align="center">
  <img src="public/internmash-logo.png" alt="InternMash logo" width="96" height="96">
</p>

<h1 align="center">InternMash</h1>

<p align="center">
  Compare tech internship programs head-to-head and build a community-ranked Elo leaderboard.
</p>

<p align="center">
  <a href="https://www.internmash.com">Website</a>
  ·
  <a href="docs/software-design.md">Design</a>
  ·
  <a href="docs/setup-runbook.md">Setup</a>
</p>

## What it does

- Shows two internship programs and lets visitors vote on where they would rather intern.
- Updates company Elo ratings through an atomic Supabase Postgres function.
- Renders a searchable, sortable, paginated leaderboard.
- Tracks lightweight anonymous analytics for public product stats.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Supabase Postgres
- Upstash Redis
- Tailwind CSS

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in Supabase values in `.env.local`.

4. Run `supabase/schema.sql` in the Supabase SQL Editor.

5. Start the app:

   ```bash
   npm run dev
   ```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Docs

- [Software design](docs/software-design.md)
- [Implementation blueprint](docs/implementation-blueprint.md)
- [Setup runbook](docs/setup-runbook.md)
- [Supabase](docs/supabase.md)
