# 0024: CI runner standard and sharded Site quality

## Status

Accepted

Date: 2026-11-06

## Context

PR CI took too long, and Site quality was the slowest part. The baseline, from
15 green runs:

| Workflow     | Time     | Notes                                                                                             |
| ------------ | -------- | ------------------------------------------------------------------------------------------------- |
| CI           | 47 s     | Quality, Test, Build, Commitlint and CI passed                                                    |
| CodeQL       | 73 s     |                                                                                                   |
| Lighthouse   | 5.7 min  |                                                                                                   |
| Site quality | 11.5 min | Playwright `Run e2e` 506 s in one job; Visual 408 s: 154 s snapshots and 227 s WebKit and Firefox |

The light jobs (lint, test, commit and title checks) use about 1,750 billed
minutes a month. The Blacksmith free tier is 3,000 minutes a month on 2 vCPU,
shared by the whole andryorelabs org.

The andryorelabs CI runner standard v1.1 was agreed across andryore-web,
animated-fluent-emojis, snug, emet and aokit. It says:

- One repository variable, `BLACKSMITH_RUNNER`, selects the runner for the light
  jobs. The name is not `CI_RUNNER`, which means the VPS in emet and streamboss.
- A fork PR always runs on `ubuntu-latest`.
- There is no visibility gate in the expression. A public repository leaves the
  variable unset.
- Never routed: release and publish, deploy, cron, CodeQL, Scorecard,
  Lighthouse, and macOS or Windows jobs.

## Decision

### Runner routing

These jobs use exactly
`${{ github.event.pull_request.head.repo.fork && 'ubuntu-latest' || vars.BLACKSMITH_RUNNER || 'ubuntu-latest' }}`:

- `ci.yml`: `quality`, `test`, `commitlint` and `ci-passed`.
- `lint-pr.yml`: `validate-title`.
- `lint-docs.yml`: `check-links`.
- `labels.yml`: `sync`.
- `lint-workflows.yml`: `lint`.

They are short, need no Docker and no browsers, and run on every PR, so they are
where a faster runner pays off and where the free minutes go furthest.

Every other job keeps a literal `ubuntu-latest`:

- `ci.yml:build`: the production build stays on the same GitHub-hosted image
  that Site quality and Lighthouse build on, so a difference between runners
  cannot hide a broken build.
- `site-quality.yml`, all jobs: they run Docker, the Playwright browsers and the
  pinned Playwright image, and they are the heaviest minutes. Sharding speeds
  them up instead.
- `lighthouse.yml`: scores depend on the runner; moving it would shift the
  budget baseline.
- `codeql.yml` and `scorecard.yml`: security analysis, never routed by the
  standard.
- `release.yml`: release, never routed by the standard.
- `grid-snapshot.yml`: cron, never routed by the standard.

A fork PR resolves to `ubuntu-latest` first, so code from a fork never runs on
an org-paid runner and never spends the shared minutes.

`scripts/workflows-invariants.test.ts` lists the routed jobs as `<file>:<job>`
and fails `bun run test` when a routed job does not use the exact expression,
another job is not on a literal `ubuntu-latest`, a job outside the list reads
`vars.BLACKSMITH_RUNNER`, a listed job no longer exists, or any `runs-on`
matches `vps-*` or `self-hosted`.

### The variable stays unset

The repository is meant to be public
([ADR 0011](0011-public-repo-security-posture.md)), and standard GitHub-hosted
runners are free and unmetered for public repositories. Routing them to
Blacksmith would spend minutes the whole org shares for no saving. With the
variable unset, every job resolves to `ubuntu-latest`, so the change is a no-op
until the owner opts in.

To turn it on:

```sh
gh variable set BLACKSMITH_RUNNER --body blacksmith-2vcpu-ubuntu-2404
```

Only the listed jobs move. To roll back:

```sh
gh variable delete BLACKSMITH_RUNNER
```

No workflow uses a Blacksmith action, and no job runs on a self-hosted runner.

### Sharded Site quality

The speed-up comes from Site quality on `ubuntu-latest`:

- `e2e` (`Accessibility and layout (Playwright)`) runs as a 4-shard matrix with
  `fail-fast: false`. Each shard runs
  `bun run test:e2e --project=chromium --project='mobile-*' --shard="$SHARD"`,
  with `SHARD: ${{ matrix.shard }}/4` passed through `env:`, and uploads its own
  `e2e-report-<shard>` artifact on failure.
- `playwright.config.ts` sets `fullyParallel: true`, so tests within a file
  spread across workers and shards. No spec uses `describe.serial` or
  `beforeAll`.
- The old `visual` job is split in two parallel jobs with the same fork guard:
  `visual` (`Visual snapshots`, `bun run test:visual`) and `browsers`
  (`Layout in WebKit and Firefox`, `bun run test:browsers`).

Rejected options:

- Route Site quality to Blacksmith: the heaviest minutes would drain the shared
  free tier, and the jobs need Docker and browsers.
- Merge the shard reports with `merge-reports`: it adds a job after the shards
  for a report that is only needed when a shard fails.
- A visibility gate in the expression: the standard keeps one expression for
  every repository and leaves the variable unset on public ones instead.

## Consequences

- Site quality time is bounded by the slowest shard instead of the 506 s single
  run, and the snapshots no longer wait for WebKit and Firefox.
- Each shard builds the Site and installs Chromium, so Site quality uses more
  runner minutes in total; on a public repository they are free.
- A test that depends on its order within a file breaks under `fullyParallel`;
  new specs must stay independent.
- The required checks keep their names: `CI passed`, `Validate PR title` and
  `Check markdown links`. Shard checks are named by GitHub, such as
  `Accessibility and layout (Playwright) (1)`, and are not required.
- Turning Blacksmith on or off is one variable, with no workflow change.
