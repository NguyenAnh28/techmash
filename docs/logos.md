# Logos

## Purpose

InternMash uses company domains to render logos on demand. This avoids hand-maintaining logo files for hundreds of companies.

## Main Component

Logo rendering lives in `components/CompanyLogo.tsx`.

The component receives:

- `name`: company name for alt text and fallback initials.
- `domain`: domain used by logo.dev.
- `background`: optional background color for hard-to-see logos.

## Logo Source

The app uses logo.dev image URLs:

```txt
https://img.logo.dev/{domain}?token={publicToken}&fallback=404&format=png&size=128
```

The token comes from:

```txt
NEXT_PUBLIC_LOGO_DEV_TOKEN
```

This is a public logo.dev token, not a Supabase secret.

## Domain Fields

`companies.domain` is the normal company website domain.

`companies.logo_domain` is an optional override used when the normal company domain does not return the right logo. For example, a company might use a parent company domain or a shorter brand domain for logos.

When rendering, the app prefers:

```ts
company.logo_domain ?? company.domain
```

## Logo Background

Some logos are white or very light. On a white page, they can disappear.

`companies.logo_background` gives the UI a per-company background override. This lets a logo sit on a darker or branded tile without changing the whole card design.

## Fallback Behavior

The logo.dev URL uses `fallback=404`.

If logo.dev cannot find a logo, the image request fails. `CompanyLogo` catches the error with `onError` and switches to an initial-letter badge.

This prevents broken image icons from appearing in the UI.

## Next.js Image Optimization

The logo image uses Next.js `Image`.

The component does not use `unoptimized`, which allows Next.js and Vercel to optimize and cache remote images.

`next.config` allows the remote host:

```txt
img.logo.dev
```

The image cache TTL is configured so logo requests are cached for a long time after first load.

## Analytics

When a logo fails, the app records a `logo_error` analytics event.

That helps identify companies that need:

- A better `logo_domain`.
- A `logo_background` override.
- A fallback-only display.

## Adding A Logo Fix

To fix a wrong logo:

1. Update the correction logic in `supabase/seed.ts`.
2. Set `logo_domain` to the domain that returns the correct logo.
3. Set `logo_background` only if the logo needs contrast.
4. Run the seed script.
5. Refresh the app and verify voting cards plus leaderboard rows.
