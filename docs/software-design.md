# InternMash Software Design README

## Purpose

This document defines the software design for InternMash at the system level. It is written as an engineering handoff: a senior engineer owns the architecture, makes the tradeoffs explicit, and delegates implementation work to mid-level and junior engineers with clear boundaries.

InternMash is intentionally small, but it should not be casual. The product is a public voting system where anonymous users compare two internship programs, every vote updates an Elo ranking, and the leaderboard exposes the community ranking. That means the important engineering qualities are correctness, low latency, abuse resistance, clear UI state, and simple operational recovery.

The central design principle is:

> Keep the browser fast and dumb, keep writes server-owned and atomic, and cache expensive public reads behind a predictable refresh window.

## Product Surface

InternMash has four public product areas:

- Voting page at `/`: users compare two companies and cast a vote.
- Leaderboard page at `/leaderboard`: users browse, search, sort, paginate, and inspect company details.
- Stats page at `/stats`: users see aggregate anonymous activity and data-quality signals.
- Notes/blog pages at `/blog` and `/blog/[slug]`: static editorial notes about the product and engineering work.

The current stack:

- Next.js App Router with React Server Components by default.
- Client Components only for interactive UI: voting, leaderboard controls, modals, timers, analytics tracking, logo fallbacks.
- Supabase Postgres as the source of truth.
- Supabase service-role access only from server-side code.
- Upstash Redis for distributed vote rate limiting.
- logo.dev for remote company logos, with local fallback badges.
- Vitest for utility tests, TypeScript for static correctness, ESLint for code hygiene.

## Non-Negotiable System Invariants

These invariants are more important than any individual implementation detail:

1. A browser must never be able to directly mutate `companies.rating`, `companies.votes_won`, or `companies.total_matches`.
2. A vote must update both companies in one atomic database operation.
3. A matchup must never contain the same company twice.
4. The leaderboard's displayed rank must always mean official Elo rank, even when the visible table is sorted by salary, win rate, or matches completed.
5. Search and sort must apply globally before pagination.
6. Missing logos, pay, reports, locations, or perks must never break the UI.
7. Analytics must never block the core voting or browsing experience.
8. Public pages should be indexable and shareable without requiring client-side data bootstrapping.

When an implementation conflicts with one of these, stop and redesign before shipping.

## High-Level Architecture

```text
Browser
  |
  | renders public pages, sends votes, sends analytics beacons
  v
Next.js App Router
  |
  | Server Components load initial page data
  | Server Actions perform trusted reads/writes
  | Route Handlers validate analytics payloads
  v
Supabase Postgres
  |
  | companies: rankings and internship metadata
  | leaderboard_snapshots: compact rank maps per refresh window
  | analytics_events: anonymous product events
  v
External services
  |
  | Upstash Redis: distributed vote rate limits
  | logo.dev: remote company logo images
```

The design deliberately avoids adding a separate API layer for the MVP. Next.js Server Actions are sufficient because the browser only needs a few trusted operations: fetch a matchup, cast a vote, and fetch leaderboard data through server-rendered routes.

If the app later needs mobile clients, third-party API access, or authenticated user accounts, we should introduce versioned route handlers or a small API service. Until then, Server Actions keep the system compact.

## Request Flows

### Voting Flow

The hot path is the voting loop:

1. `app/page.tsx` calls `getMatchup()` on the server.
2. `getMatchup()` calls `fetchRandomMatchup()` in `app/actions.ts`.
3. `fetchRandomMatchup()` calls the Supabase RPC `get_random_matchup()`.
4. `createMatchupFromCompanies()` converts the returned rows into `{ companyA, companyB }`.
5. `VoteMatchup` renders two `MatchupCard` components.
6. On click, `VoteMatchup.handleVote()` calls `castVote(winnerId, loserId)`.
7. `castVote()` validates IDs, enforces Redis rate limits, then calls the Supabase RPC `record_company_vote()`.
8. `record_company_vote()` locks both rows, calculates Elo, updates counters, and returns the new ratings.
9. `castVote()` asks for the next matchup and returns it to the client.
10. The client swaps in the next matchup without a full-page reload.

This flow keeps the user's click responsive while keeping all sensitive work on the server and in the database.

### Leaderboard Flow

The leaderboard is a public read-heavy path:

1. `app/leaderboard/page.tsx` parses `page`, `q`, and `sort` from URL search params.
2. The page calls `getLeaderboard({ page, pageSize, query, sort })`.
3. `getLeaderboard()` calculates the current global five-minute refresh window.
4. `getCachedLeaderboardSnapshot()` loads or reuses a cached snapshot.
5. On a cold window, `fetchLeaderboardSnapshot()` reads all companies ordered by Elo, annotates official ranks, reads the previous snapshot, and upserts the current rank map.
6. `paginateLeaderboardSnapshot()` filters by query, builds lightweight sort records, sorts globally, then slices the requested page.
7. `LeaderboardTable` renders the result and owns interactive search, custom sort menu, pagination links, and company detail modal state.

The critical ordering is:

```text
load cached Elo snapshot
  -> filter by search query
  -> precompute sort keys
  -> sort the filtered result
  -> paginate the sorted result
```

This ordering prevents incorrect pagination and avoids wasting sort work on companies that will be filtered out.

### Analytics Flow

Analytics are first-party and intentionally low ceremony:

1. `AnalyticsTracker`, `VoteMatchup`, and `CompanyLogo` call `trackAnalyticsEvent()`.
2. The client writes via `navigator.sendBeacon()` when available, then falls back to `fetch(..., { keepalive: true })`.
3. `/api/analytics` validates body size, event type, path, session ID, and JSON metadata shape.
4. The route inserts into `analytics_events` through the server-side Supabase client.

Analytics failures are swallowed on the client. A broken analytics insert should never make voting or page navigation feel broken.

## Data Model

### `companies`

`companies` is the product source of truth.

Important fields:

- `id`: stable UUID primary key.
- `name`: unique display name.
- `domain`: primary company website domain.
- `logo_domain`: optional override for logo.dev lookup.
- `logo_background`: optional visual hint for logos needing contrast.
- `hourly_pay`: internship hourly pay.
- `num_submits`: source report count for pay/location confidence.
- `housing_perk`: currently used as location text.
- `signature_perk`: short detail shown on cards.
- `rating`: current Elo rating.
- `votes_won`: total wins.
- `total_matches`: total matchups involving this company.
- `created_at`: insertion timestamp.

The table allows public reads through RLS. It does not allow public updates. Server code uses the service role key and controlled RPC functions for sensitive writes.

### `leaderboard_snapshots`

`leaderboard_snapshots` stores one compact rank map per refresh window:

- `window_start`: refresh-window primary key.
- `rankings`: JSON object mapping company ID to one-based official Elo rank.
- `total_count`: company count at snapshot time.
- `created_at`: insertion timestamp.

This table powers movement tags without storing a full duplicated company snapshot.

### `analytics_events`

`analytics_events` stores anonymous product events:

- `event_type`: allowed event name.
- `path`: route and query string.
- `session_id`: anonymous browser-generated ID from local storage.
- `metadata`: bounded JSON payload.
- `created_at`: insertion timestamp.

The current stats page reads recent rows and aggregates in application code. That is acceptable at the current scale, but it is not the final analytics architecture.

## Important Functions and Ownership

### `createSupabaseAdminClient()`

Location: `lib/supabase/server.ts`

Creates a cached server-only Supabase client using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Ownership: senior or mid-level engineer. Any edit here has security implications. Do not expose the service role key to Client Components or public route responses.

### `getMatchup()`

Location: `app/actions.ts`

Public Server Action that returns a random two-company matchup. It delegates row selection to the database RPC `get_random_matchup()`.

Ownership: mid-level engineer. Keep the action thin; database selection strategy can evolve behind the same action contract.

### `castVote(winnerId, loserId)`

Location: `app/actions.ts`

Trusted vote entry point. It validates IDs, rate limits by request IP, calls `record_company_vote()`, revalidates the home page, and returns a next matchup.

Ownership: senior engineer for behavior changes; mid-level engineer for safe error-message or response-shape improvements. This function is part of the integrity boundary.

### `record_company_vote()`

Location: `supabase/schema.sql`

Postgres function that:

- rejects null IDs;
- rejects same-company votes;
- locks both company rows in deterministic ID order;
- calculates expected Elo scores;
- writes winner and loser ratings/counters in one transaction;
- returns new ratings.

Ownership: senior engineer. This is the consistency core of the application.

### `getCachedLeaderboardSnapshot()`

Location: `lib/leaderboard.ts`

Wraps snapshot generation in `unstable_cache` with a five-minute revalidation interval. The cache key is tied to the current refresh window.

Ownership: senior or strong mid-level engineer. Changes here directly affect freshness, load, and rank movement behavior.

### `sortLeaderboardCompanies()`

Location: `utils/leaderboard.ts`

Filters first, then precomputes sort records, then sorts. It supports:

- `elo`
- `salary`
- `win-rate`
- `matches`

Performance rules:

- Do not calculate division inside `.sort()`.
- Do not call `toLowerCase()` inside `.sort()`.
- Do not use `localeCompare()` in hot tie-breakers.
- Tie non-Elo sorts by official Elo rank, then normalized company name.

Ownership: mid-level engineer. Junior engineers can add tests around this function, but should not change sorting semantics without review.

### `LeaderboardTable`

Location: `components/LeaderboardTable.tsx`

Owns the leaderboard UI:

- controlled search input;
- debounced URL-backed search;
- custom sort dropdown;
- pagination with `scroll={false}`;
- company detail modal;
- accessible close behavior and focus restoration.

Ownership: mid-level engineer for state and accessibility; junior engineer for visual-only refinements with review.

### `CompanyLogo`

Location: `components/CompanyLogo.tsx`

Builds logo.dev URLs from domains, handles failed image loads, tracks `logo_error`, and falls back to deterministic initial badges.

Ownership: junior or mid-level engineer. Safe area for UI polish, but be careful not to leak the logo.dev token server-side incorrectly. The current token is public because logo images are client-visible.

## Concurrency and Consistency Design

### Vote Concurrency

The dangerous scenario is two users voting on overlapping companies at the same time. If the app performed separate read-modify-write updates from JavaScript, one vote could overwrite another with stale ratings or counters.

The database RPC avoids this by locking both rows:

```sql
perform 1
from companies
where id in (winner_id, loser_id)
order by id
for update;
```

The deterministic order reduces deadlock risk. Once both rows are locked, the function reads current values, calculates Elo, and updates both companies before the transaction completes.

We also use:

- `lock_timeout = '750ms'` to avoid long queues on hot rows;
- `statement_timeout = '3000ms'` to fail before serverless requests hang;
- Upstash Redis rate limiting to reduce abusive write volume.

This is a pragmatic MVP consistency model. It is correct for atomic vote writes and resilient enough for launch traffic.

### Leaderboard Consistency

Votes update the database immediately, but the leaderboard is intentionally snapshot-based. The leaderboard may be up to five minutes stale.

This is a product and infrastructure tradeoff:

- Pro: public leaderboard traffic does not repeatedly force expensive database sorts.
- Pro: users see stable rank movement windows instead of twitchy per-second changes.
- Con: a vote does not always appear on the leaderboard immediately.

The UI makes this visible with the refresh timer. We should not pretend this is real-time if it is actually cached.

### Client State Consistency

The search input uses local React state so typing remains responsive and does not lose focus during server navigations. URL updates are debounced and passed through Next router calls with `{ scroll: false }`.

The URL remains the source of shareable state, but the input element remains stable during typing. This is the correct UX tradeoff: the user's cursor should win over perfectly synchronous URL reflection.

## Performance Design

### Current Bottlenecks

1. `get_random_matchup()` uses `order by random()`.
   - Fine for a few hundred companies.
   - Becomes expensive at large table sizes.

2. `record_company_vote()` creates row-level contention on popular companies.
   - Correctness requires row locks.
   - Hot rows may fail fast under high write bursts.

3. Leaderboard snapshot generation reads and sorts all companies.
   - Acceptable because it happens once per refresh window per cache region.
   - Warm requests only filter/sort the in-memory snapshot.

4. Search and non-Elo sorting happen in application memory.
   - Fine at the current scale.
   - Should move toward indexed database search or materialized projections if the catalog grows to tens of thousands of companies.

5. Stats page aggregates recent analytics rows in the app.
   - Fine for capped launch analytics.
   - Needs pre-aggregated rollups if public traffic grows.

6. Logo loading depends on a third-party image provider.
   - UI handles failure.
   - Performance depends on remote image latency and browser cache behavior.

### Existing Mitigations

- Cached leaderboard snapshots with a five-minute global refresh window.
- Filter-before-sort pipeline.
- Precomputed sort keys.
- Bounded page size.
- Database lock and statement timeouts.
- Redis-backed vote rate limiting.
- Analytics payload size limits.
- Client-side analytics fire-and-forget behavior.
- Logo fallbacks and logo-error tracking.

### Future Performance Work

When traffic or data size requires it, prioritize in this order:

1. Replace `order by random()` with sampled IDs or a precomputed matchup queue.
2. Add an abuse-resistant vote identity model, such as signed anonymous sessions or auth.
3. Move leaderboard sorting variants into materialized views or periodically generated projections.
4. Add aggregate analytics tables instead of scanning raw events.
5. Add database indexes for normalized company search if the company table grows meaningfully.
6. Introduce edge caching or route-level CDN strategies for public read pages.

Do not optimize these prematurely. The current design is intentionally simple where scale does not yet justify complexity.

## Security and Abuse Boundaries

The primary security boundary is server-only mutation:

- Browser users can read public company rows.
- Browser users cannot update company rankings.
- Vote writes go through `castVote()` and `record_company_vote()`.
- Analytics writes go through `/api/analytics`, not public table policies.
- Leaderboard snapshot rows are server-owned.

Known abuse risks:

- One user can still vote repeatedly within rate limits.
- IP-based rate limiting is imperfect behind shared networks or VPNs.
- There is no account identity or per-matchup replay protection.

These are acceptable MVP tradeoffs, not permanent guarantees. If InternMash gets meaningful traffic, the next abuse-control step should be stronger anonymous identity plus per-pair vote deduplication.

## Error Handling Model

Server functions return `ActionResult<T>`:

```ts
{ ok: true, data }
{ ok: false, error }
```

This keeps UI code honest. Client Components should not need to catch raw Supabase errors. They should render product-safe messages.

Error handling rules:

- Validation errors should be user-readable.
- Database and infrastructure errors should be friendly, not leaky.
- Analytics errors should not surface to users.
- Vote lock/rate-limit failures should invite retry rather than imply data corruption.
- Missing data should render fallbacks, not blank boxes.

## Testing Strategy

Current test focus is mostly pure utilities, which is correct for this codebase size.

Required checks before merging:

```bash
npm run lint
npm run typecheck
npm test
```

High-value test areas:

- Elo math, including equal-rating outcomes.
- Matchup validation: two companies, no duplicates.
- Vote ID validation.
- Leaderboard pagination boundaries.
- Leaderboard search, sort normalization, and tie-breakers.
- Missing-value formatting.
- Error mapping for vote database failures.

Areas that deserve future tests:

- Component-level tests for `LeaderboardTable` search focus and no-scroll navigation behavior.
- Integration test for `castVote()` against a local Supabase test database.
- Analytics route validation tests.
- Accessibility smoke tests for the custom sort dropdown and company detail modal.

## Engineering Delegation Plan

### Senior Engineer Ownership

Senior engineers own decisions that can corrupt data, expose secrets, or create scaling cliffs:

- Database schema and RPC design.
- RLS policies and service-role boundaries.
- Vote concurrency and transaction behavior.
- Leaderboard caching and freshness model.
- Abuse prevention strategy.
- Production incident response.
- Major data model migrations.

Senior review is required for changes to:

- `supabase/schema.sql`
- `lib/supabase/server.ts`
- `app/actions.ts` vote behavior
- `lib/leaderboard.ts`
- cache/revalidation strategy
- environment variable handling

### Mid-Level Engineer Ownership

Mid-level engineers should own bounded features with clear contracts:

- Leaderboard search/sort/pagination behavior.
- Client UI state that touches URL navigation.
- Stats page aggregation improvements.
- Analytics event additions.
- Modal behavior and accessibility.
- Seed script improvements.
- Performance improvements with measurable before/after numbers.

Expected behavior from mid-level engineers:

- Write tests for utility logic.
- Preserve existing contracts unless a migration plan exists.
- Identify whether a change affects freshness, correctness, or security.
- Ask for senior review before moving logic across trust boundaries.

### Junior Engineer Ownership

Junior engineers can safely own well-contained implementation tasks:

- Visual polish in components.
- Copy updates.
- Fallback states for missing data.
- Adding seed rows or correcting company metadata.
- Small documentation updates.
- Tests for pure utility functions.
- Simple accessibility fixes with review.

Good junior tasks should come with:

- exact file targets;
- expected UI behavior;
- screenshots or examples;
- test commands to run;
- a clear "do not touch" list.

### Example Delegation Tickets

Mid-level ticket:

> Add a new leaderboard sort option. Extend `LeaderboardSortOption`, update `LEADERBOARD_SORT_OPTIONS`, precompute the new sort key in `createLeaderboardSortRecord()`, add utility tests, update `LeaderboardTable` labels, and preserve official Elo rank display.

Junior ticket:

> Add fallback copy for missing `signature_perk` in company profile cards. Do not change database schema or vote behavior. Run lint and typecheck.

Senior ticket:

> Redesign matchup selection to avoid `order by random()` at 10k companies. Provide a migration plan, expected latency target, failure mode, and rollback path before implementation.

## Deployment and Operations

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LOGO_DEV_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Operational rules:

- Run `supabase/schema.sql` before deploying features that depend on schema/RPC changes.
- Use `npm run seed:internships:dry` before reseeding.
- Use `npm run seed:internships` only when the CSV/correction changes are intentional.
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of Client Components and public logs.
- Treat leaderboard freshness complaints as product questions first and infrastructure bugs second; the five-minute delay is intentional.

## Definition of Done

A feature is done when:

- The user-facing behavior works at desktop and mobile widths.
- The feature preserves the system invariants in this document.
- Server mutations stay server-owned.
- Missing data and error states render cleanly.
- Relevant utility tests exist.
- `npm run lint`, `npm run typecheck`, and `npm test` pass.
- Documentation is updated if the feature changes architecture, database shape, caching, or public behavior.

The goal is not to make InternMash complicated. The goal is to keep it simple in the places that benefit from simplicity, and strict in the places where one sloppy shortcut can damage trust.
