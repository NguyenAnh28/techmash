# Blog

## Purpose

The blog is a small notes section for explaining the product decisions behind InternMash.

It is not a CMS. It is a lightweight set of local article objects rendered through Next.js routes.

## Routes

The blog list lives at:

```txt
/blog
```

Individual posts live at:

```txt
/blog/[slug]
```

## Content Source

Blog content is defined in local code at `lib/blog.ts`.

Each post has:

- Slug.
- Category.
- Date.
- Reading time.
- Title.
- Excerpt.
- Body sections.

This keeps the blog simple and versioned with the rest of the app.

## List Page

The list page uses the same visual language as the rest of the site:

- White background.
- Simple centered header.
- Large elegant headline.
- Thin row separators.
- Article rows with large titles.

Cards were intentionally simplified into clickable rows so the page feels more editorial and less heavy.

## Article Page

Each article page opens as its own route. This is better than expanding cards inline because:

- The URL can be shared.
- Browser back/forward behavior is natural.
- The list page stays simple.
- Articles have room to breathe.

## Adding A Post

To add a post:

1. Add a new post object to the blog data module.
2. Give it a unique slug.
3. Write a short excerpt for the list page.
4. Add body sections for the article page.
5. Check `/blog` and `/blog/[slug]` locally.

## Good Topics

Useful InternMash notes include:

- Why pairwise voting works better than asking for a ranked list.
- Why Elo is a good MVP ranking model.
- How the logo pipeline works.
- How the CSV seed process keeps the dataset maintainable.
- What the app learns from anonymous analytics.
