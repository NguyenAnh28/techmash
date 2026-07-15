# Leaderboard

## Purpose

The leaderboard shows the public ranking of internship programs. It is ordered by Elo rating and refreshed from a cached snapshot.

## Route

The leaderboard lives at `/leaderboard`.

`app/leaderboard/page.tsx` reads the current page number from the URL, fetches the cached leaderboard snapshot, and passes the full ranked snapshot into `LeaderboardTable`.

## Data Fetching

Leaderboard data is loaded through `getLeaderboard()` in `app/actions.ts`.

The action returns:

- The full ranked company list.
- A page of company rows for default pagination metadata.
- The current rank, previous rank, and rank delta for each row.
- The total company count.
- Pagination metadata.
- Snapshot metadata.

The full sorted list is cached by 5-minute global windows. Each request slices that cached list in memory for the requested page, and the client uses the full snapshot for instant search. This avoids sorting and reading the database on every leaderboard request.

Rows are sorted by rating from highest to lowest when the snapshot is generated. The page size is 20 companies.

Each generated snapshot is also written to Supabase as a compact rank map. The next snapshot compares against the previous rank map to show whether a company moved up, moved down, stayed in place, or is new to the ranking.

This adds one previous-snapshot read and one current-snapshot upsert when a new 5-minute window is generated. Warm leaderboard requests still use the cached snapshot and slice it in memory.

## Refresh Cadence

The leaderboard snapshot includes:

- `lastRefreshedAt`
- `nextRefreshAt`
- `refreshIntervalSeconds`

The refresh window is rounded to clean 5-minute boundaries. For example, a request at `2:24` belongs to the `2:20` snapshot and points to `2:25` as the next refresh.

`components/LeaderboardRefreshTimer.tsx` shows a countdown in the leaderboard header. Times are displayed in the configured leaderboard timezone, currently Pacific Time through `America/Los_Angeles`. When the countdown reaches zero, the UI shows a manual refresh action.

The app does not auto-refresh every open browser tab at the same second. That avoids a traffic spike at the refresh boundary.

## Table Layout

`components/LeaderboardTable.tsx` renders the search input, table, pagination controls, and company detail modal.

Each row shows:

- Rank and movement tag.
- Company logo and name.
- Elo rating.
- Salary.
- Location.
- Win rate.

The table is wrapped in a rounded bordered container so it feels consistent with the voting cards. Rows use light separators, subtle hover states, and soft shadows around the full leaderboard panel.

Movement tags use the previous 5-minute global snapshot:

- Green upward triangle: company moved up.
- Red downward triangle: company moved down.
- Muted dash: rank did not change.
- Muted `New`: no previous rank was available.

## Pagination

The leaderboard shows 20 companies at a time.

The pagination footer displays:

- The visible item range.
- The total company count.
- Previous and next page links.
- Current page number.

Pagination is URL-based, so `/leaderboard?page=2` can be linked directly.

## Search

Leaderboard search is instant and client-side.

The page sends the full cached snapshot to the browser once. As the user types, `LeaderboardTable` filters company names in memory without making new Supabase requests.

Search behavior:

- Case-insensitive company-name matching.
- Original global ranks are preserved.
- Pagination is hidden while search is active.
- Clearing the input restores normal paginated browsing.

## Company Detail Modal

Clicking a company logo or name opens a modal with a read-only company card.

The modal reuses `CompanyProfileCard`, which is the same visual body used by the voting page. This keeps the company presentation consistent across the app.

The modal adds leaderboard context:

- Current rank.
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
