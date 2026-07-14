# Algorithm

## Purpose

InternMash uses Elo ratings to turn pairwise votes into a live ranking. Every company starts with a rating, and each vote moves the winner up and the loser down.

## Implementation File

The TypeScript implementation lives in `utils/elo.ts`.

The database also implements the same math inside `record_company_vote` so ratings can be updated atomically.

## Elo API

The app exposes:

```ts
calculateElo(winnerRating, loserRating, K = 32)
```

It returns:

```ts
{
  newRatingWinner: number;
  newRatingLoser: number;
}
```

Ratings are rounded to whole numbers.

## How Elo Works

Elo estimates how likely each side is to win based on current ratings.

If two companies have the same rating, each has a 50 percent expected chance of winning.

If a high-rated company beats a low-rated company, the rating change is smaller because the result was expected.

If a low-rated company beats a high-rated company, the rating change is larger because the result was surprising.

## K Factor

The app uses a K factor of 32.

That means each vote can move ratings enough to feel visible, while still keeping rankings stable after many votes.

Example:

- Winner starts at 1200.
- Loser starts at 1200.
- K is 32.
- Winner becomes 1216.
- Loser becomes 1184.

## Vote Counters

Each recorded vote updates both rating and counters.

Winner:

- Rating changes upward.
- `votes_won` increases by 1.
- `total_matches` increases by 1.

Loser:

- Rating changes downward.
- `total_matches` increases by 1.

## Atomic Updates

The vote update is not split into separate client-side database writes.

Instead, the server calls the Supabase/Postgres RPC `record_company_vote`. The function locks both company rows, calculates the new ratings, updates both rows, and returns the new values.

This matters because multiple users can vote at the same time. Row locking prevents one vote from overwriting another vote's rating update.

## Validation

The vote path rejects:

- Missing winner or loser IDs.
- Votes where winner and loser are the same company.
- Votes where either company no longer exists.

Validation happens in both server code and the database RPC.

## Tests To Keep

The useful tests for this part are:

- Equal ratings produce 1216 and 1184 with K 32.
- A favorite winning moves less than 16 points.
- An underdog winning moves more than 16 points.
- Invalid votes do not update ratings.
- Concurrent votes do not lose updates.
