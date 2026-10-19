# 0017: GitHub contributions served by the runtime endpoint

## Status

Accepted. Amends [0004](0004-live-status-endpoint.md) and
[0009](0009-no-third-party-requests.md): the contribution grid is fetched at
runtime, no longer generated at build time only. Amended by
[0022](0022-secrets-in-dotenvx-encrypted-env-files.md): the token lives in an
encrypted env file, and the build uses it too.

Date: 2026-10-18

Revised: 2026-10-19, Status records that it also changes 0009

Revised: 2026-10-20, the token is in the encrypted env file (0022)

## Context

The GitHub tile showed a grid captured at build time, so it was only as fresh as
the last deploy. Andry wants it to reflect current activity. Reading the grid
needs a GitHub token, so the browser cannot call GitHub
([0009](0009-no-third-party-requests.md)).

## Decision

- **The runtime endpoint from 0004 also serves the contribution grid.** It runs
  in the same process behind the same nginx proxy, with the token from the
  encrypted env file ([0022](0022-secrets-in-dotenvx-encrypted-env-files.md)).
- The answer is cached in memory for one hour. When the token is missing or
  GitHub fails, the endpoint returns an error and the tile keeps the build
  capture, labelled with its own date.
- The tile says how long ago the grid was updated.

### Rejected alternatives

- **Scheduled rebuilds**: a deploy per hour to refresh one tile.
- **Calling GitHub from the browser**: needs a token and breaks 0009.

## Consequences

- The build capture stays as the fallback, so `grid:update` stays.
- The endpoint has a second route to test and a second cache to reason about.
