# Analytics

## Purpose

InternMash includes simple first-party analytics so the app can show product usage without relying only on Vercel traffic charts.

The goal is not user tracking. The goal is to understand high-level behavior:

- Which pages are being viewed.
- How many votes are being cast.
- Which logos are failing.
- How active the app is over time.

## Storage

Events are stored in the `analytics_events` table in Supabase.

Each event has:

- `event_type`
- `path`
- `session_id`
- `metadata`
- `created_at`

The `metadata` column is JSON so each event type can store small details without adding a new database column every time.

## Event Ingestion

The API route is:

```txt
app/api/analytics/route.ts
```

Client components send events to this route. The route validates the payload and inserts the event with the server-side Supabase client.

Because events go through the server, the browser does not need direct write permission to the analytics table.

## Client Tracking

`components/AnalyticsTracker.tsx` records page views as the user moves through the app.

Other components record specific events:

- Voting records vote-related events.
- Logo rendering records logo errors.

## Anonymous Sessions

The app uses an anonymous session ID, not a user account.

This is usually a random ID stored in the browser so several events in the same visit can be grouped together. It does not identify a real person by itself.

## Public Stats Page

`/stats` turns analytics into a public showcase page.

It is meant to be a recruiter-friendly view of the system working in the wild:

- Page views.
- Vote activity.
- Active sessions.
- Event totals.
- Recent activity trends.

The page should show aggregates only. Raw sessions and raw event metadata should stay hidden.

## Privacy Boundaries

Do not store sensitive user information in analytics metadata.

Avoid:

- Names.
- Emails.
- IP addresses.
- Exact device fingerprints.
- Free-form text typed by users.

The current app only needs anonymous product behavior.

## Common Queries

Useful aggregate questions:

- How many page views happened today?
- How many votes were cast this week?
- Which page receives the most traffic?
- How many unique anonymous sessions used the app?
- Which company domains produce logo errors?

These can be calculated from `analytics_events` by grouping on `event_type`, `path`, `session_id`, and time buckets.
