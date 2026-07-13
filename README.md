# InternMash

InternMash is a Next.js and Supabase app where visitors choose where they would rather intern. Votes update Elo ratings through an atomic Postgres function, and the leaderboard shows the global internship ranking.

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

Implementation details live in `docs/implementation-blueprint.md` and setup notes live in `docs/setup-runbook.md`.
