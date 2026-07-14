# Leaderboard

## Purpose

The leaderboard shows the public ranking of internship programs. It is ordered by Elo rating and updates as the community votes.

## Route

The leaderboard lives at `/leaderboard`.

`app/leaderboard/page.tsx` reads the current page number from the URL, fetches leaderboard rows from Supabase, and passes them into `LeaderboardTable`.

## Data Fetching

Leaderboard data is loaded through `getLeaderboard()` in `app/actions.ts`.

The action returns:

- A page of company rows.
- The total company count.
- Pagination metadata.

Rows are sorted by rating from highest to lowest. The page size is 20 companies.

## Table Layout

`components/LeaderboardTable.tsx` renders the table and pagination controls.

Each row shows:

- Rank.
- Company logo and name.
- Elo rating.
- Win rate.
- Vote record.

The table is wrapped in a rounded bordered container so it feels consistent with the voting cards. Rows use light separators, subtle hover states, and soft shadows around the full leaderboard panel.

## Pagination

The leaderboard shows 20 companies at a time.

The pagination footer displays:

- The visible item range.
- The total company count.
- Previous and next page links.
- Current page number.

Pagination is URL-based, so `/leaderboard?page=2` can be linked directly.

## Company Detail Modal

Clicking a company logo or name opens a modal with a read-only company card.

The modal reuses `CompanyProfileCard`, which is the same visual body used by the voting page. This keeps the company presentation consistent across the app.

The modal adds leaderboard context:

- Current rank.
- Elo rating.
- Wins.
- Total matches.
- Win rate.

The modal does not allow voting. It is only a detail view.

## Modal Behavior

The modal supports:

- Close button.
- Escape key.
- Backdrop click.
- Background scroll lock while open.
- Focus returning to the clicked company button after close.

On mobile, the modal becomes a padded full-width sheet so it does not overflow horizontally.

## Missing Data

Leaderboard rows use the same fallbacks as voting cards:

- Missing logo: initial-letter badge.
- Missing pay: "Not listed".
- Missing reports: "No reports".
- Missing location: "Location not listed".
- Missing internship detail: generic fallback copy.

## Win Rate

Win rate is calculated from `votes_won / total_matches`.

If `total_matches` is zero, the UI shows a safe zero-state instead of dividing by zero.
