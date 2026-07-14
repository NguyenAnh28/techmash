# Frontend

## Purpose

The frontend gives InternMash a simple public interface:

- Vote between two internship programs.
- Browse the live leaderboard.
- Open company details from the leaderboard.
- Read short build notes on the blog.
- View public usage stats.

The visual system is light, minimal, and type-led. Most UI uses white backgrounds, black text, thin borders, soft shadows, and compact uppercase labels.

## Main Routes

The app uses the Next.js App Router.

- `/`: voting screen.
- `/leaderboard`: ranked company table.
- `/blog`: list of build notes.
- `/blog/[slug]`: individual article page.
- `/stats`: public analytics and usage page.
- `/api/analytics`: API route for recording anonymous events.

## Shared Layout

`app/layout.tsx` defines the global document shell. It loads the app font, global styles, the navbar, the footer, and the analytics tracker.

`components/Navbar.tsx` contains the fixed navigation. It is split visually into a left brand pill and a right navigation pill. The navbar is sticky so it remains visible while scrolling.

`components/Footer.tsx` is intentionally quiet. It keeps basic project context and a GitHub link without pulling attention away from the app.

## Styling

The app uses Tailwind CSS for layout and component styling. The current design language favors:

- White page backgrounds.
- Black primary text.
- Slate gray secondary text.
- Thin borders using light black or slate values.
- Rounded rectangles, but not overly pill-shaped cards.
- Soft shadows for depth.
- Wide letter spacing only on small metadata labels.

Most pages share a similar header pattern: small uppercase label, large simple headline, and a short subtitle. The blog page established the style, and the vote and leaderboard pages follow it.

## Component Boundaries

The app uses a mix of server and client components.

Server-side pieces fetch data from Supabase and render page structure. Client components handle interactions such as voting, opening modals, pagination controls, image fallback state, and analytics events.

Important components:

- `components/VoteMatchup.tsx`: client voting controller.
- `components/MatchupCard.tsx`: clickable voting card wrapper.
- `components/CompanyProfileCard.tsx`: shared company card body.
- `components/CompanyLogo.tsx`: logo.dev image rendering with fallback.
- `components/LeaderboardTable.tsx`: leaderboard table, pagination, and detail modal.
- `components/AnalyticsTracker.tsx`: page-view tracking.

## Shared Company Card

The company card UI is centralized in `CompanyProfileCard`.

It renders:

- Company logo.
- Current Elo rating.
- Company name.
- Hourly pay.
- Number of data reports.
- Location.
- Internship detail text.
- A caller-provided footer.

The voting page uses this card with a `Choose` footer. The leaderboard modal uses the same card with read-only stats. This keeps the visual language consistent and avoids maintaining two versions of the same card.

## Data Shape

Most UI components receive a `Company` object from `types/company.ts`.

The important display fields are:

- `name`
- `domain`
- `logo_domain`
- `logo_background`
- `hourly_pay`
- `num_submits`
- `housing_perk`
- `signature_perk`
- `rating`
- `votes_won`
- `total_matches`

The app expects missing metadata to be possible. Components display fallback text such as "Not listed", "No reports", or a logo initial badge when data is absent.
