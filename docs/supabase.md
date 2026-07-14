# Supabase

## Purpose

Supabase stores the company leaderboard, internship metadata, vote counters, and anonymous analytics events.

The app reads public company data from Supabase and performs sensitive writes through server-side code.

## Schema File

The database setup script lives at `supabase/schema.sql`.

Run it in the Supabase SQL Editor when creating or updating the database structure.

## Companies Table

`companies` is the main product table.

Important columns:

- `id`: UUID primary key.
- `name`: unique company name.
- `domain`: company website domain from the CSV dataset.
- `logo_domain`: optional override domain for logo.dev.
- `logo_background`: optional CSS background value for logos that need contrast.
- `hourly_pay`: hourly internship pay.
- `num_submits`: number of compensation data reports.
- `housing_perk`: currently used as location text.
- `signature_perk`: short internship detail text.
- `rating`: current Elo rating.
- `votes_won`: number of pairwise wins.
- `total_matches`: number of matchups involving the company.
- `created_at`: row creation time.

The app no longer stores static `logo_url` values. Logos are derived at render time from domains.

## Analytics Table

`analytics_events` stores anonymous product events.

Important columns:

- `id`: UUID primary key.
- `event_type`: event name such as `page_view`, `vote_cast`, or `logo_error`.
- `path`: page path where the event happened.
- `session_id`: anonymous browser session identifier.
- `metadata`: JSON details for the event.
- `created_at`: event time.

The public stats page only shows aggregate results, not raw event rows.

## Leaderboard Snapshots Table

`leaderboard_snapshots` stores one compact rank map per global refresh window.

Important columns:

- `window_start`: primary key for the 5-minute leaderboard window.
- `rankings`: JSON object mapping company IDs to one-based ranks.
- `total_count`: number of companies in that snapshot.
- `created_at`: row creation time.

The app uses this table to compare the current cached leaderboard snapshot against the previous snapshot and render rank movement tags.

## Row Level Security

RLS is enabled.

The `companies` table allows public read access so pages can show leaderboard and voting data.

Public update access is intentionally not enabled. Users do not write directly to company rows from the browser.

Analytics rows also do not have a public read policy. Events are inserted through the server API route.

Leaderboard snapshot rows also do not have a public read policy. They are written and read by server-side leaderboard code only.

## Vote RPC

The function `record_company_vote(winner_id, loser_id, k_factor)` records a vote.

It:

- Validates the IDs.
- Rejects same-company votes.
- Locks both company rows.
- Calculates Elo changes.
- Updates winner and loser counters.
- Returns the new ratings.

Only the Supabase service role is granted execute permission. The browser never calls this RPC directly.

## Server Access

Server Actions use a Supabase client created with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service role key must stay server-only. It belongs in `.env.local` for local development and in Vercel environment variables for deployment.

## Seeding Data

The seed script is `supabase/seed.ts`.

It reads `data/internships.csv`, maps rows into the `companies` table, applies domain/logo corrections, removes excluded companies, and upserts the remaining companies.

Run:

```bash
npm run seed:internships:dry
```

to validate what will be seeded without writing.

Run:

```bash
npm run seed:internships
```

to update Supabase.

The seed script is safe to run again after editing the CSV or correction list. It updates company metadata but does not reset ratings unless the script is changed to do so.

## Deployment Notes

Vercel needs the same environment variables as local development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LOGO_DEV_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

The database schema must already exist in Supabase before the deployed app can record votes or analytics.
