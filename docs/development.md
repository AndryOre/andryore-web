# Development

## Setup

```sh
bun install --frozen-lockfile
```

Bun `1.4.2` is required (see `packageManager` in `package.json`). Husky installs
the git hooks on `bun install` through the `prepare` script. `bunfig.toml` sets
`linker = "isolated"`.

## Scripts

| Script                 | What it does                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `bun run check`        | Aggregate gate: `format:check`, `lint`, `typecheck` and `knip`.                                    |
| `bun run fix`          | Formats the repository with Prettier, then autofixes ESLint findings (`format:write`, `lint:fix`). |
| `bun run cache:clear`  | Removes `/tmp/node-compile-cache`, `.eslintcache` and `node_modules/.cache`.                       |
| `bun run format:check` | Checks formatting with Prettier (no writes).                                                       |
| `bun run format:write` | Formats the repository with Prettier.                                                              |
| `bun run lint`         | ESLint with zero warnings allowed, using `--cache --cache-strategy content`.                       |
| `bun run lint:fix`     | ESLint with autofix.                                                                               |
| `bun run typecheck`    | `astro check && tsc --noEmit`.                                                                     |
| `bun run knip`         | Finds unused files, exports and dependencies.                                                      |
| `bun run test`         | Runs `bun test` with coverage and the `bunfig.toml` threshold.                                     |
| `bun run lint:docs`    | Offline link and anchor check of the Markdown with lychee.                                         |
| `bun run lint:commits` | Runs commitlint over the commits of the current branch.                                            |
| `bun run ci:local`     | Frozen install, `lint:commits`, `check`, `lint:docs` and `test`: the PR gates that need no build.  |
| `bun run brand:export` | Regenerates the brand rasters from the logo SVGs. Never edit the generated rasters by hand.        |

When a command crashes inside `typescript.js`, see
[Troubleshooting](troubleshooting.md). `eslint` and `tsc` run without `--bun`.
Agents do not run a `build` script unless explicitly asked.

## Coverage

`bunfig.toml` turns coverage on for `bun test` and sets
`coverageThreshold = { lines = 0.55, functions = 0.4 }`. A run under either
value fails, locally and in CI. Test files are skipped from the report
(`coverageSkipTestFiles`).

`scripts/coverage-manifest.test.ts` enforces the manifest rule: every source
module under `scripts`, `eslint-rules`, `docs/brand/tools` and `src` needs a
colocated `.test.ts` or `.test.mjs`, or an entry in its `EXEMPTIONS` map with a
written reason. The test also fails on a stale exemption: the module is gone,
now has a test, or the reason is empty.

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

`shadcnNoRestyleContracts` does not exist yet: it arrives with AO-1965, the
Astro site scaffold. Until then `eslint.config.mjs` has no contracts to edit.

## Skills install and update

`.claude/skills` holds 25 third-party skills. They are installed with
`bunx skills add <owner>/<repo>#<commit> -s <skill> -a claude-code`, always
pinned to a commit so `skills-lock.json` records the exact `ref`. Read each
`SKILL.md` and any bundled script before committing it. `bunx skills update`
moves the pins, so review the diff the same way.

## MCP servers

`.mcp.json` declares two HTTP servers: `linear-server` (the issue tracker) and
`astro-docs` (the Astro documentation search; use it before guessing an Astro
API).

## ADR index

`docs/adr/README.md` indexes every ADR. A new ADR adds its row there, and
`docs/adr/adr-invariants.test.ts` enforces the header format, unique sequential
numbers, an allowed status and that the index lists every file.

## CI

Every PR runs `.github/workflows/ci.yml`. Job names:

- **Quality**: format check, lint, typecheck, knip.
- **Test**: `bun test`.
- **Build**: `bun run build`, so a broken build fails the PR. It is the only
  place the build runs; locally it stays opt-in.
- **Commitlint**: validates the PR's commit messages.
- **CI passed**: aggregates the jobs above; it is the single required status
  check, and the release gate reads it (see [Releasing](#releasing)).

Other workflows: `lint-pr.yml` (PR title), `lint-docs.yml` (offline link and
anchor check with lychee), `lint-workflows.yml` (workflow linting), `codeql.yml`
(CodeQL analysis, skipped while the repository is private because code scanning
is unavailable on GitHub Free), `scorecard.yml` (OpenSSF Scorecard) and
`labels.yml` (label sync). All third-party actions are pinned to a commit SHA,
and `scripts/workflows-invariants.test.ts` asserts the workflow invariants:
every `uses:` pinned to a 40-character SHA, explicit permissions (top-level
`contents: read` or stricter), `timeout-minutes` on every job,
`persist-credentials: false` on every checkout (a job with `contents: write` may
opt in with `true`), no `pull_request_target`, and no expression interpolated
inside a `run` script. `scripts/workflow-files.ts` parses the workflow files for
those tests.

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

Pushing a `v*` tag triggers `.github/workflows/release.yml`. After the
main-ancestry check, a gate step polls the check runs of the tagged commit and
requires a green `CI passed`, waiting up to 20 minutes for a pending one. A
failed or missing `CI passed` stops the release; re-run the failed CI job on
`main`, then re-run the release workflow. After the gate, the workflow extracts
the matching section of `CHANGELOG.md` as the release notes and creates the
GitHub Release. Nothing is published to npm.

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

A test (`scripts/workflows-invariants.test.ts`) also asserts that the required
check names in the rulesets match the jobs the workflows define, so renaming a
job without updating `.github/rulesets` fails CI.

## Repository settings

The rulesets above are committed as code, but most GitHub repository settings
are not: secret scanning, push protection, private vulnerability reporting, the
read-only default `GITHUB_TOKEN` and fork-PR approval are applied through the
GitHub API or the settings UI.
[ADR 0011](adr/0011-public-repo-security-posture.md) records which of them are
in place and which are still open (`sha_pinning_required`, immutable releases,
fork-PR approval for all outside contributors and the CodeQL default setup).
Settings are owner actions; an agent never changes them.
