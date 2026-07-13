# TechMash Implementation Blueprint

## Purpose

TechMash is a small full-stack web app where visitors compare two tech companies and vote for the one they prefer. Each vote updates the companies' Elo ratings, and the global leaderboard shows the current ranking.

The product is intentionally simple for the first version:

- No user accounts.
- No private voting history.
- Public leaderboard.
- Server-only database writes.
- Supabase Postgres as the source of truth.
- Next.js App Router for pages, server actions, and deployment on Vercel.

The Gemini-generated plan is a good starting point. It correctly identifies the two-screen product flow, the companies table, the Elo formula, and a leaderboard sorted by rating. The main implementation change is the vote write path: counter increments and Elo updates should happen in one atomic database operation, not through separate client-side-style updates.

## Product Flow

The home page presents two random companies side by side. A visitor clicks the company they prefer. The app immediately disables the voting controls, shows a loading state, records the vote on the server, refreshes the affected data, and displays another random matchup.

The leaderboard page shows all companies ordered by rating, highest first. Each row includes rank, logo, company name, Elo rating, wins, total matches, and win rate.

Core user expectations:

- The two companies in a matchup are always different.
- A vote is counted once per click.
- The next matchup appears without a full page feeling broken or stale.
- The leaderboard reflects recent votes.
- Missing logos or failed image loads do not break the layout.

## Recommended Architecture

Use Next.js 14 or newer with the App Router and TypeScript.

Use Server Components by default. Use Client Components only where browser interaction is required, such as the clickable voting cards and loading state.

Use Supabase in two ways:

- Public read access for displaying companies and the leaderboard.
- Server-only write access through a Supabase service role key stored in server environment variables.

Do not expose the service role key to the browser. Do not let the browser update `companies` directly. All vote writes should go through a Next.js Server Action, which calls a database function that updates both companies together.

Recommended app structure:

```text
app/
  actions.ts
  page.tsx
  leaderboard/
    page.tsx
components/
  CompanyCard.tsx
  HeaderNav.tsx
  LeaderboardTable.tsx
  VoteMatchup.tsx
lib/
  supabase/
    server.ts
types/
  company.ts
utils/
  elo.ts
```

The exact folder names can change, but the boundaries should stay clear:

- `utils/elo.ts` contains pure Elo math.
- `app/actions.ts` contains server actions.
- Supabase client setup stays in a small server-only helper.
- UI components do not calculate ratings or directly write to the database.

## Data Model

The MVP needs one main table: `companies`.

```sql
create table companies (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  domain text,
  hourly_pay integer,
  num_submits integer,
  housing_perk text,
  signature_perk text,
  rating integer default 1200 not null,
  votes_won integer default 0 not null,
  total_matches integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

The matching TypeScript shape should be explicit:

```ts
export interface Company {
  id: string;
  name: string;
  domain: string | null;
  hourly_pay: number | null;
  num_submits: number | null;
  housing_perk: string | null;
  signature_perk: string | null;
  rating: number;
  votes_won: number;
  total_matches: number;
  created_at: string;
}
```

For the MVP, enable row level security and allow public reads only:

```sql
alter table companies enable row level security;

create policy "Allow public read access"
on companies
for select
using (true);
```

Do not add a public update policy for the recommended implementation. Public updates make it easy for any browser script to change ratings, wins, or match counts. Server Actions with a service role key can bypass RLS safely from the server.

## Seed Data

Seed the database from `data/internships.csv`. The CSV is the source of truth for the company catalog and includes `name`, `domain`, `hourly_pay`, `num_submits`, `housing_perk`, and `signature_perk`. Company logos are resolved on demand by the frontend through logo.dev, so the database should store `domain`, not generated logo URLs.

## Atomic Vote Function

The original generated plan tried to put `supabase.rpc(...)` calls inside `.update(...)` values. That is not the correct shape for Supabase JavaScript updates. Instead, create a single Postgres function that:

- Validates that winner and loser are different.
- Locks both company rows for update in deterministic ID order.
- Reads the current ratings and counters.
- Calculates new Elo ratings.
- Increments `votes_won` for the winner.
- Increments `total_matches` for both companies.
- Updates both rows in the same database transaction.

Recommended SQL:

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

This function is the safest MVP write path because concurrent votes cannot overwrite each other's counters with stale values.
The execute grants keep the RPC available to the server-side service role while preventing anonymous browser clients from calling the write function directly.

## Elo Logic

Keep a TypeScript version of the Elo formula in `utils/elo.ts`. It is useful for tests, documentation, and any future non-database calculations.

```ts
export interface EloResult {
  newRatingWinner: number;
  newRatingLoser: number;
}

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  K = 32,
): EloResult {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));

  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  return {
    newRatingWinner: Math.round(winnerRating + K * (1 - expectedWinner)),
    newRatingLoser: Math.round(loserRating + K * (0 - expectedLoser)),
  };
}
```

With equal starting ratings of `1200` and `1200`, the winner should become `1216` and the loser should become `1184`.

Because the database function also performs Elo math, keep the TypeScript and SQL formulas aligned. If the K-factor changes, update tests and any SQL default at the same time.

## Server Actions

Create a server-only Supabase client using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The public URL can be exposed to the browser. The service role key must only exist on the server and in Vercel environment variables.

Recommended action result shape:

```ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

`getMatchup()` should:

- Fetch companies from Supabase.
- Return `null` or an error result if fewer than two companies exist.
- Choose two different companies.
- Return `{ companyA, companyB }`.

`castVote(winnerId, loserId)` should:

- Reject empty IDs.
- Reject matching winner and loser IDs.
- Call `record_company_vote` through `supabase.rpc(...)`.
- Return a typed success or error result.
- Call `revalidatePath('/')` and `revalidatePath('/leaderboard')` after a successful vote.

Keep vote logic on the server. The client should only pass IDs and render the response.

## Voting Page

Route: `/`

Layout behavior:

- Light background with black text and restrained gray hover states.
- Minimal header navigation with links to Vote and Leaderboard.
- Centered two-column matchup on desktop.
- Single-column stacked matchup on small screens.
- Large company cards with logo, company name, and current rating.

Interaction behavior:

- Clicking a card submits that company as the winner and the other company as the loser.
- Disable both cards while the vote is pending.
- Show a visible loading state, such as reduced opacity, spinner text, or a pending overlay.
- Prevent double-clicks by ignoring clicks while pending.
- After a successful vote, fetch or receive the next matchup.
- If the vote fails, show a short error message and re-enable the cards.

Card visual behavior:

- Use `hover:scale-105 transition-transform duration-200` or an equivalent Tailwind transition.
- Keep cards keyboard accessible with button semantics.
- Use alt text for logos.
- Render company logos from `https://img.logo.dev/{domain}` through Next.js image optimization.
- Configure `img.logo.dev` in `next.config.ts` and set `minimumCacheTTL: 31536000`.
- If logo.dev returns a missing asset, show a modern colored initial-letter badge.

Empty state:

- If fewer than two companies exist, show a message that the app needs at least two companies before voting can start.

## Leaderboard Page

Route: `/leaderboard`

Fetch companies on the server and order by rating descending.
Mark the route as dynamic or use a no-store fetch strategy so the page reads current leaderboard data after votes.

For a straightforward App Router implementation, set:

```ts
export const dynamic = 'force-dynamic';
```

Leaderboard columns:

- Rank.
- Logo and company name.
- Elo rating.
- Wins.
- Total matches.
- Win rate.

Win rate formula:

```ts
const winRate =
  company.total_matches === 0
    ? 0
    : Math.round((company.votes_won / company.total_matches) * 100);
```

Display `0%` when `total_matches` is `0`. Do not divide by zero or show `NaN%`.

Use a responsive table layout. On small screens, the table can reduce columns or use compact row styling, but rank, name, rating, and win rate should stay visible.

## Error And Edge Cases

Handle these cases explicitly:

- Supabase environment variables are missing.
- Supabase query fails.
- The database has fewer than two companies.
- A user submits the same company as winner and loser.
- A submitted ID does not exist.
- A user double-clicks during a pending vote.
- A company logo URL returns a missing or broken asset.
- A company has zero total matches.
- Concurrent votes happen for the same company pair.

For the MVP, show simple user-facing errors. Log server-side details in development, but avoid leaking secret values or raw database internals to the browser.

## Acceptance Criteria

The implementation is complete when:

- The app has a working `/` voting page.
- The app has a working `/leaderboard` page.
- Voting updates Elo ratings and counters.
- The winner's `votes_won` increases by one.
- Both companies' `total_matches` increase by one.
- Ratings are rounded integers.
- The leaderboard is sorted by rating descending.
- Win rate never displays `NaN`.
- Double-clicks do not submit duplicate votes from the same pending UI action.
- Public users can read leaderboard data.
- Public users cannot directly update company rows from the browser.
- The app builds successfully for Vercel.

## Verification Checklist

Before shipping:

- Run the Elo unit tests.
- Run tests for action validation.
- Run a manual vote and confirm both database rows changed correctly.
- Refresh the leaderboard and confirm rank order changed if ratings moved.
- Test on a narrow mobile viewport.
- Test a company with a missing or broken logo URL.
- Run linting, type checking, and a production build.

## References

- [Next.js Server Actions](https://nextjs.org/docs/app/guides/server-actions)
- [Next.js `revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase secure data guidance](https://supabase.com/docs/guides/database/secure-data)
- [Supabase JavaScript `rpc`](https://supabase.com/docs/reference/javascript/rpc)
