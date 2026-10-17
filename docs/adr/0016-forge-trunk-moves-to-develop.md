# 0016: forge trunk moves to develop

## Status

Accepted. Amends [0015](0015-develop-as-integration-branch.md).

Date: 2026-10-17

## Context

0015 kept `repo.trunk` at `main` until AO-1964 was merged. The owner decided to
move it now, so every `/forge` run integrates on `develop`.

## Decision

- **`repo.trunk` in `forge.config.json` is `develop`.** Waves, worktrees and PRs
  from `/forge` target `develop`.
- **`main` still receives `develop` by promotion PR**, as in 0015.
- **AO-1964 reaches `main` through a promotion PR too**, not directly.

## Consequences

- The Site on `main` stays the loading placeholder until the first promotion.
- Coolify keeps deploying from `main` (0003), so nothing deploys until a
  promotion PR is merged.
