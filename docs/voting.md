# Voting

## Purpose

The voting page is the core loop of InternMash. It shows two random companies and asks the user where they would rather intern. After a vote, the app updates Elo ratings and loads a new matchup.

## Route

The voting screen lives at `/`.

`app/page.tsx` fetches an initial matchup on the server and passes it to `VoteMatchup`.

## Main Components

`components/VoteMatchup.tsx` owns the interactive voting state.

It tracks:

- The current pair of companies.
- Whether a vote is in progress.
- Which company was clicked.
- Error states from the vote action.

`components/MatchupCard.tsx` renders each clickable card. It wraps the shared `CompanyProfileCard` with voting behavior.

`components/CompanyProfileCard.tsx` renders the common card body used by both voting and leaderboard detail views.

## User Flow

1. The server calls `getMatchup()` to ask Postgres for two random companies.
2. The page renders both companies side by side on desktop and stacked on smaller screens.
3. The user clicks one card.
4. The clicked company becomes the winner and the other company becomes the loser.
5. `castVote(winnerId, loserId)` runs on the server.
6. The database updates both companies in one atomic operation.
7. The app asks Postgres for another two-company matchup.
8. The public leaderboard keeps using its current cached snapshot until the next refresh window.

## Vote Safety

The UI disables cards while a vote is in progress. This prevents accidental double-clicks from sending repeated votes from the same interaction.

The server action also validates:

- Both IDs are present.
- The winner and loser are different companies.
- Both companies still exist in the database.

The database RPC repeats the important validation before writing, so invalid requests do not change rankings.

Votes are also rate limited on the server side. The launch default is 40 votes per minute per IP address, tracked through Upstash Redis so the limit works across Vercel serverless instances.

The vote transaction has short database timeouts. If a popular company row is locked by too many concurrent votes, the request fails quickly with a friendly retry message instead of waiting until the serverless function times out.

## Matchup Selection

Matchup selection happens in Supabase through the `get_random_matchup()` RPC.

The old MVP path loaded every company row into the Next.js server and picked two companies in memory. The current path lets Postgres sample two rows and sends only those two rows back to the app. This keeps the voting loop lighter as the company table grows.

## Card Metadata

The voting cards show internship context from the `companies` table:

- `hourly_pay`: shown as `$X/hr`.
- `num_submits`: shown as report count.
- `housing_perk`: currently displayed as location text.
- `signature_perk`: displayed as internship detail.

If a field is missing, the UI uses readable fallback text instead of leaving blank space.

## Analytics

The voting page records anonymous usage events through `/api/analytics`.

Tracked events include:

- Viewing a matchup.
- Casting a vote.
- Logo load failures from company cards.

These events do not identify a user account. They are meant to show product usage and surface data quality issues.

## Leaderboard Freshness

Votes update company ratings immediately in Supabase, but the public leaderboard is intentionally snapshot-based.

That means a vote may not appear on `/leaderboard` right away. The leaderboard refreshes on a 5-minute cadence so high vote volume does not force every leaderboard visitor to hit a freshly sorted database query.

## Empty State

If the database has fewer than two companies, `getMatchup()` returns `null`. The page should show a friendly empty state instead of rendering broken cards.
