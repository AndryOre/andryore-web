# Development

## Setup

```sh
bun install --frozen-lockfile
```

Bun `1.4.2` is required (see `packageManager` in `package.json`). Husky installs
the git hooks on `bun install` through the `prepare` script. `bunfig.toml` sets
`linker = "isolated"`.

## Scripts

| Script                 | What it does                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `bun run check`        | Aggregate gate: `format:check`, `lint`, `typecheck` and `knip`.                             |
| `bun run fix`          | Formats the repository with Prettier (`format:write`).                                      |
| `bun run format:check` | Checks formatting with Prettier (no writes).                                                |
| `bun run format:write` | Formats the repository with Prettier.                                                       |
| `bun run lint`         | ESLint with zero warnings allowed, using `--cache --cache-strategy content`.                |
| `bun run lint:fix`     | ESLint with autofix.                                                                        |
| `bun run typecheck`    | `tsc --noEmit`.                                                                             |
| `bun run knip`         | Finds unused files, exports and dependencies.                                               |
| `bun run test`         | Runs `bun test`.                                                                            |
| `bun run lint:docs`    | Offline link and anchor check of the Markdown with lychee.                                  |
| `bun run lint:commits` | Runs commitlint over the commits of the current branch.                                     |
| `bun run ci:local`     | Frozen install, `lint:commits`, `check` and `test`: the CI pipeline locally.                |
| `bun run brand:export` | Regenerates the brand rasters from the logo SVGs. Never edit the generated rasters by hand. |

`eslint` and `tsc` run without `--bun`. Agents do not run a `build` script
unless explicitly asked.

## Git hooks

Hooks live in `.husky/`:

- **`pre-commit`** runs `lint-staged`: Prettier and ESLint on staged code files,
  Prettier alone on staged `json`, `md`, `css` and `yml` files
  (`lint-staged.config.mjs`).
- **`commit-msg`** runs `commitlint` with `@commitlint/config-conventional`. It
  enforces the Conventional Commits shape and type list, not the emoji.
- **`pre-push`** rejects a push whose branch name does not match `<type>/<slug>`
  (or `main`, `renovate/*`).

## Branch naming

`<type>/<slug>`, where type is one of `feat`, `fix`, `docs`, `style`,
`refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` and the slug is
lowercase kebab-case, for example `feat/add-log-page`.

## Commit format

`type: emoji lowercase subject`, for example `feat: ✨ add log page`, in
English, with a bulleted body when it helps. PRs are squash-merged, so the PR
title follows the same format. The hook does not enforce the emoji; it is a
convention.

## Code documentation

Comments are TSDoc blocks only, on non-obvious exports. A local ESLint rule
(`eslint-rules/`) rejects `//` and plain `/* */` comments; the only exceptions
are directive comments a tool reads, such as `eslint-disable`,
`@ts-expect-error` and `prettier-ignore`. Rationale:
[ADR 0005](adr/0005-tsdoc-only-code-comments.md).

## Adding a `@shadcn/lint` contract

The `shadcn/no-restyle` rule restricts which classes a call site may pass to a
shadcn/ui component. A contract is an entry of `shadcnNoRestyleContracts` in
`eslint.config.mjs`. Add or widen one only when a finding reveals a real,
repeating design decision, not to silence a single finding. Work up the ladder
in [`AGENTS.md`](../AGENTS.md#escalating-a-shadcnlint-finding) first: an
existing variant, then a new variant, then a contract, and only then a one-line
`eslint-disable-next-line -- <reason>`. Record the decision in an ADR when the
contract is new. See [ADR 0006](adr/0006-tailwind-and-shadcn-islands.md).

## Skills install and update

Third-party skills live in `.claude/skills` and are installed with
`bunx skills add <owner>/<repo>#<commit> -s <skill> -a claude-code`, always
pinned to a commit so `skills-lock.json` records the exact `ref`. Read each
`SKILL.md` and any bundled script before committing it. `bunx skills update`
moves the pins, so review the diff the same way.

## CI

Every PR runs `.github/workflows/ci.yml`. Job names:

- **Quality**: format check, lint, typecheck, knip.
- **Test**: `bun test`.
- **Commitlint**: validates the PR's commit messages.
- **CI passed**: aggregates the jobs above; it is the single required status
  check.

Other workflows: `lint-pr.yml` (PR title), `lint-docs.yml` (offline link and
anchor check with lychee), `lint-workflows.yml` (workflow linting), `codeql.yml`
(CodeQL analysis, skipped while the repository is private because code scanning
is unavailable on GitHub Free), `scorecard.yml` (OpenSSF Scorecard) and
`labels.yml` (label sync). All third-party actions are pinned to a commit SHA,
and `scripts/workflows-invariants.test.ts` asserts the workflow invariants.

## Renovate

Renovate (`renovate.json5`) opens the dependency update pull requests and tracks
them in the Dependency Dashboard issue. Review them like any other PR: the
`CI passed` check must be green. Renovate branches are named `renovate/*`, which
the `pre-push` hook allows.

## Releasing

Releases are tag-driven and have no npm step. The notes come from
`CHANGELOG.md`.

1. In `CHANGELOG.md`, move the `[Unreleased]` entries into a new
   `## [x.y.z] - YYYY-MM-DD` section and leave an empty `## [Unreleased]` above
   it.
2. Run `bun run check` and `bun run test`.
3. Open a PR titled `chore: 🔖 release x.y.z` and merge it.
4. Tag the merge commit with a signed tag and push it:
   `git tag -s vX.Y.Z <merge-sha> && git push origin vX.Y.Z`.

Pushing a `v*` tag triggers `.github/workflows/release.yml`, which extracts the
matching section of `CHANGELOG.md` as the release notes and creates the GitHub
Release. Nothing is published to npm.

## Merging

This repository merges pull requests via squash merge only, keeping a linear
history on `main`. Individual commits in a PR need not follow the commit format,
but the PR title does, since it becomes the squashed commit message. The
`CI passed` check must be green. The branch and tag rulesets are committed in
[`.github/rulesets`](../.github/rulesets) (`main.json`, `tags.json`) and applied
with `gh api`, not by code in the repository.

Apply when the repository is public: on GitHub Free, the API rejects rulesets on
a private repository with
`403 Upgrade to GitHub Pro or make this repository public to enable this feature.`
Once the repository is public, apply each file:

```sh
gh api -X POST repos/AndryOre/andryore-web/rulesets --input .github/rulesets/main.json
gh api -X POST repos/AndryOre/andryore-web/rulesets --input .github/rulesets/tags.json
```

The required check names (`CI passed`, `Validate PR title`,
`Check markdown links`) are the job names in `ci.yml`, `lint-pr.yml` and
`lint-docs.yml`.
