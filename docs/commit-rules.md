# Commit Rules

Use this checklist before creating commits for InternMash.

## Commit Shape

- Keep each commit focused on one feature, fix, data change, or documentation update.
- Split unrelated work into separate commits, even if the work happened in the same coding session.
- Prefer commits that a reviewer can understand from the file list and message without extra context.
- Do not rewrite, fake, or manipulate commit dates. Use normal Git history.
- Do not stage unrelated local edits just because they are present in the working tree.

## Commit Messages

Use short imperative messages:

```text
feat: add leaderboard last page navigation
data: add OpenAI and Vercel seed rows
docs: document commit workflow
```

Good prefixes for this project:

- `feat`: user-facing feature or behavior.
- `fix`: bug fix.
- `data`: CSV, seed, or catalog updates.
- `docs`: Markdown documentation.
- `test`: test coverage or test tooling.
- `refactor`: code structure change without intended behavior change.
- `chore`: maintenance that does not fit the other buckets.

## Safety Checks

- Never commit `.env.local`, service role keys, database passwords, or API tokens.
- Check `git status --short` before staging.
- Prefer `git add <specific-file>` over `git add .`.
- Run the smallest useful verification before committing. For frontend changes, use:

```bash
npm run lint
npm run typecheck
```

- If a seed or schema file changed, run the relevant dry-run or setup command before committing:

```bash
npm run seed:internships:dry
```

## Review Flow

1. Inspect the diff.
2. Group files by intent.
3. Stage only the files for the current intent.
4. Commit with a clear message.
5. Repeat until the working tree is clean except for intentionally uncommitted local files.

If a change is unclear, leave it unstaged and explain it instead of guessing.
