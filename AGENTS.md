# AGENTS.md

Instructions for coding agents working in this repository.

## Layout

A single-package bun repository for the personal site
[andryore.dev](https://andryore.dev): a static Astro site, TypeScript (strict),
ESM-only. The root holds the tooling (husky, commitlint, prettier, eslint, knip)
and the documentation:

- [`docs/adr`](docs/adr): architecture decision records.
- [`docs/brand`](docs/brand): the public brand assets and their export tooling.
- [`docs/agents`](docs/agents): the tracker and `/forge` specifics for agents.
- [`eslint-rules`](eslint-rules): local ESLint rules, such as the TSDoc-only
  comment rule.
- [`scripts`](scripts): repo scripts (commit lint, docs link check) and their
  tests.

The domain vocabulary is in [`CONTEXT.md`](CONTEXT.md). Skills live in
`.claude/skills` and are pinned in `skills-lock.json`.

## Running scripts

Always use `bun run <script>` — never call the underlying tool directly, and
never use another package manager (this repo uses `bun.lock`). Read
`package.json`'s `scripts` before inventing a command.

- `bun run check` — format check, lint, typecheck and knip. Run this after any
  change.
- `bun run test` — the `bun test` suite. Run this after any change to tested
  code.
- `bun run lint:docs` — offline link and anchor check of the Markdown. Run this
  after any docs change.
- `bun run fix` — formats the repository with Prettier. Prose wraps always.
- `bun run build` — **do not run unless explicitly asked.** It is slow and not
  needed to verify most changes.

## Branch and commit conventions

Branches are `<type>/<slug>`. Commits and PR titles are
`type: emoji lowercase subject`, for example `feat: ✨ add log page`, in English
with a bulleted body when it helps. The emoji is a convention, not lint
enforced. Detail:
[`docs/development.md#branch-naming`](docs/development.md#branch-naming),
[`docs/development.md#commit-format`](docs/development.md#commit-format).

## Code comments

Every code comment is a TSDoc block on a non-obvious export. No `//` or
non-JSDoc `/* */` comments, except lint or type directives. Detail:
[`docs/development.md#code-documentation`](docs/development.md#code-documentation),
[ADR 0005](docs/adr/0005-tsdoc-only-code-comments.md).

## Escalating a `@shadcn/lint` finding

When `bun run lint` reports a `shadcn/*` finding (for example
`shadcn/no-restyle`) on a component you are changing, work up this ladder —
never disable the rule file-wide or project-wide:

1. Use an existing shadcn/ui variant that already covers the styling you need.
2. Add a new variant to the component if no existing one fits.
3. Add or change a `no-restyle` contract in `shadcnNoRestyleContracts`
   (`eslint.config.mjs`), encoding one real, bounded design decision. Detail:
   [`docs/development.md#adding-a-shadcnlint-contract`](docs/development.md#adding-a-shadcnlint-contract).
4. Last resort: a single-line `eslint-disable-next-line -- <reason>` on the
   exact offending line, with a reason that says why it does not generalize.
   Never a file-level or project-level disable.

## Quirks and gotchas

- Run `eslint` and `tsc` without `--bun`; the scripts already do. ESLint uses
  `--cache --cache-strategy content`, so a stale cache is never a reason to
  delete files: run `bun run lint` again.
- Bun is pinned to `1.4.2` (`packageManager` and `engines`).
- Prettier wraps prose always; run `bun run fix` instead of reflowing by hand.
- Actions are SHA-pinned and workflows are linted; edit them with care:
  [`docs/development.md#ci`](docs/development.md#ci).
- Releases are tag-driven and have no npm step; never publish by hand:
  [`docs/development.md#releasing`](docs/development.md#releasing).
- Brand assets and Site content changes need the owner's approval:
  [ADR 0007](docs/adr/0007-split-license.md).
