# TechMash Setup Runbook

## Overview

This runbook explains how to set up, run, test, and deploy TechMash.

TechMash uses:

- Next.js 14 or newer with the App Router.
- TypeScript.
- Tailwind CSS.
- Supabase Postgres.
- Vercel for deployment.

The MVP does not require user accounts. Visitors vote anonymously, and all vote writes happen through server code.

## 1. Create The Next.js App

From the project folder, create or initialize a Next.js application with TypeScript and Tailwind CSS.

Recommended command for a new app:

```bash
npx create-next-app@latest . \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"
```

Install Supabase:

```bash
npm install @supabase/supabase-js
```

If tests are added during implementation, use the project's chosen test runner consistently. Vitest is a good fit for the Elo and action-adjacent unit tests:

```bash
npm install -D vitest
```

## 2. Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-or-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Variable usage:

- `NEXT_PUBLIC_SUPABASE_URL` identifies the Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` can be used for public reads if needed.
- `SUPABASE_SERVICE_ROLE_KEY` is used only by server actions and must never be exposed to client components.

On Vercel, add the same variables under Project Settings -> Environment Variables. Keep `SUPABASE_SERVICE_ROLE_KEY` marked as a secret server-side value.

## 3. Supabase SQL Setup

Open the Supabase SQL Editor and run this setup script. The same setup script is also available in `supabase/schema.sql`.

```sql
create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  logo_url text not null,
  rating integer default 1200 not null,
  votes_won integer default 0 not null,
  total_matches integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table companies enable row level security;

drop policy if exists "Allow public read access" on companies;
create policy "Allow public read access"
on companies
for select
using (true);

drop policy if exists "Allow public update access" on companies;
```

Create the atomic vote function:

```sql
create or replace function record_company_vote(
  winner_id uuid,
  loser_id uuid,
  k_factor integer default 32
)
returns table (
  winner_new_rating integer,
  loser_new_rating integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  winner_current companies%rowtype;
  loser_current companies%rowtype;
  expected_winner numeric;
  expected_loser numeric;
begin
  if winner_id is null or loser_id is null then
    raise exception 'winner_id and loser_id are required';
  end if;

  if winner_id = loser_id then
    raise exception 'winner_id and loser_id must be different';
  end if;

  perform 1
  from companies
  where id in (winner_id, loser_id)
  order by id
  for update;

  select *
  into winner_current
  from companies
  where id = winner_id;

  select *
  into loser_current
  from companies
  where id = loser_id;

  if winner_current.id is null or loser_current.id is null then
    raise exception 'winner or loser was not found';
  end if;

  expected_winner :=
    1 / (1 + power(10, (loser_current.rating - winner_current.rating)::numeric / 400));

  expected_loser :=
    1 / (1 + power(10, (winner_current.rating - loser_current.rating)::numeric / 400));

  winner_new_rating :=
    round(winner_current.rating + k_factor * (1 - expected_winner));

  loser_new_rating :=
    round(loser_current.rating + k_factor * (0 - expected_loser));

  update companies
  set
    rating = winner_new_rating,
    votes_won = votes_won + 1,
    total_matches = total_matches + 1
  where id = winner_id;

  update companies
  set
    rating = loser_new_rating,
    total_matches = total_matches + 1
  where id = loser_id;

  return next;
end;
$$;

revoke execute on function record_company_vote(uuid, uuid, integer) from public;
revoke execute on function record_company_vote(uuid, uuid, integer) from anon;
revoke execute on function record_company_vote(uuid, uuid, integer) from authenticated;
grant execute on function record_company_vote(uuid, uuid, integer) to service_role;
```

Seed the starting companies:

```sql
with seed_companies (name, slug, logo_variant, rating) as (
  values
    ('Google', 'google', 'default', 1200),
    ('Apple', 'apple', 'light', 1200),
    ('Microsoft', 'microsoft', 'default', 1200),
    ('Meta', 'meta', 'default', 1200),
    ('Netflix', 'netflix', 'default', 1200),
    ('Stripe', 'stripe', 'default', 1200),
    ('OpenAI', 'openai', 'light', 1200),
    ('SpaceX', 'spacex', 'default', 1200),
    ('Nvidia', 'nvidia', 'light', 1200),
    ('Vercel', 'vercel', 'light', 1200),
    ('Airbnb', 'airbnb', 'default', 1200),
    ('Uber', 'uber', 'light', 1200)
)
insert into companies (name, logo_url, rating)
select
  name,
  'https://thesvg.org/icons/' || slug || '/' || logo_variant || '.svg',
  rating
from seed_companies
on conflict (name) do update
set logo_url = excluded.logo_url;
```

## 4. Implementation Checklist

Create the shared company type:

```ts
export interface Company {
  id: string;
  name: string;
  logo_url: string;
  rating: number;
  votes_won: number;
  total_matches: number;
  created_at: string;
}
```

Create `utils/elo.ts` with `calculateElo(winnerRating, loserRating, K = 32)`.

Create a server-only Supabase client helper. It should read `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and it should only be imported by server files.

Create `app/actions.ts` with:

- `getMatchup()`, which returns two distinct companies or a graceful empty state.
- `castVote(winnerId, loserId)`, which validates IDs, calls `record_company_vote`, revalidates `/` and `/leaderboard`, and returns a typed result.

Create the voting page at `/`:

- Fetch an initial matchup on the server.
- Render a client voting component for click handling.
- Disable both cards while a vote is pending.
- Show an error if the vote fails.
- Show an empty state if fewer than two companies exist.

Create the leaderboard page at `/leaderboard`:

- Fetch companies ordered by `rating` descending.
- Mark the route dynamic, such as with `export const dynamic = 'force-dynamic';`.
- Render rank, logo/name, rating, wins, matches, and win rate.
- Display `0%` when total matches is zero.

## 5. Local Development

Run the app locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful checks during development:

```bash
npm run lint
npm run build
```

If a dedicated typecheck script is added, run it before deployment:

```bash
npm run typecheck
```

## 6. Manual Verification

Before deploying, verify these scenarios:

- Home page loads two different companies.
- Clicking one company disables both voting cards while the vote is pending.
- A successful vote changes both companies' ratings.
- Winner `votes_won` increases by one.
- Both companies' `total_matches` increase by one.
- A second matchup appears after voting.
- Leaderboard sorts by rating descending.
- Companies with zero matches show `0%` win rate.
- Broken or missing logos show a fallback.
- Refreshing `/leaderboard` shows current database values.
- Public browser code cannot update `companies` directly.

Database spot-check query:

```sql
select
  name,
  rating,
  votes_won,
  total_matches,
  case
    when total_matches = 0 then 0
    else round((votes_won::numeric / total_matches) * 100)
  end as win_rate
from companies
order by rating desc;
```

## 7. Automated Test Targets

At minimum, cover:

- Elo math for equal ratings: `1200` beats `1200` -> `1216` and `1184`.
- Elo math for mismatched ratings.
- Matchup selection returns two distinct companies.
- Matchup selection handles fewer than two companies.
- Vote validation rejects missing IDs.
- Vote validation rejects the same ID for winner and loser.
- Leaderboard win rate returns `0` when total matches is `0`.

If integration tests are practical, also test concurrent votes against `record_company_vote` to confirm counters are not lost.

## 8. Vercel Deployment

Connect the Git repository to Vercel.

Set environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the default Next.js build command:

```bash
npm run build
```

After deployment:

- Visit `/`.
- Cast a vote.
- Visit `/leaderboard`.
- Confirm the leaderboard changed.
- Check Vercel function logs if a vote fails.

## 9. Security Notes For The MVP

This version is intentionally anonymous and lightweight. The minimum acceptable security posture is:

- No service role key in client code.
- No public update policy on `companies`.
- All votes go through the server action.
- The server action calls one atomic database function.
- The UI blocks duplicate submissions while one vote is pending.

Future hardening can add rate limiting, IP-based throttling, bot protection, vote audit logs, authenticated users, or a separate `votes` table. Those are not required for the first working MVP.

## 10. Troubleshooting

If voting fails:

- Confirm `SUPABASE_SERVICE_ROLE_KEY` is set locally and in Vercel.
- Confirm the `record_company_vote` function exists in Supabase.
- Confirm both submitted IDs exist in `companies`.
- Check server logs for the exact Supabase RPC error.

If the leaderboard is empty:

- Confirm seed data was inserted.
- Confirm the public select policy exists.
- Run `select * from companies;` in the Supabase SQL Editor.

If logos do not appear:

- Confirm the `logo_url` points to a valid `https://thesvg.org/icons/{slug}/{variant}.svg` asset.
- Use `/light.svg` instead of `/default.svg` when a brand's default SVG is white on the white UI.
- Run `npm run logos:audit` or `npm run logos:audit some-slug` to check whether a new seed logo should use `default` or `light`.
- Confirm the app has a fallback UI for missing CDN assets.

If ratings look wrong:

- Confirm the K-factor is `32`.
- Confirm ratings are rounded.
- Confirm the TypeScript and SQL Elo formulas match.
