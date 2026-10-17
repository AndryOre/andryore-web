# 0015: develop as the integration branch

## Status

Accepted.

Date: 2026-10-17

## Context

Until now every branch merged straight into `main`, and `main` is what the Site
serves. The first spec (AO-1964, the Site itself) still lands on `main`. After
it, the next specs are larger than one PR and should not change what visitors
see until they are ready.

## Decision

- **`develop` is the integration branch.** From the first spec after AO-1964,
  feature branches (`<type>/<slug>`) open PRs against `develop`, not `main`.
- **`main` receives `develop` by PR.** A promotion PR from `develop` to `main`
  ships a finished spec. Merging stays squash-only, so `main` keeps a linear
  history.
- **`develop` gets the same protection as `main`**: a ruleset with the same
  rules and the same required checks, committed in
  `.github/rulesets/develop.json`.
- **CI runs on pushes to `develop`** as it does on `main`, in addition to every
  PR.
- **The branch hook accepts `develop`** besides `main`, `renovate/*` and
  `<type>/<slug>`.
- **`/forge` changes its trunk when AO-1964 is merged.** `repo.trunk` in
  `forge.config.json` stays `main` until then and moves to `develop` in a PR
  after it.

### Rejected alternatives

- **Everything on `main` behind a feature flag**: the Site is static and has no
  runtime flags to hide a half-built page.
- **Long-lived `feat/site` branch**: passes the hook, but the name hides that it
  is the integration branch for several specs.

## Consequences

- Releases still tag `main`; the release gate is unchanged.
- A spec ships in two squash merges (feature to `develop`, `develop` to `main`),
  so `main` history holds one commit per promotion, not one per PR.
- `docs/development.md` describes the flow; the rulesets are applied by the
  owner with `gh api`.
