# 0017: GitHub contributions served by the runtime endpoint

## Status

Accepted. Amends [0004](0004-live-status-endpoint.md).

Date: 2026-10-18

## Context

The GitHub tile showed a grid captured at build time, so it was only as fresh as
the last deploy. Andry wants it to reflect current activity. Reading the grid
needs a GitHub token, so the browser cannot call GitHub
([0009](0009-no-third-party-requests.md)).

## Decision

- **The runtime endpoint from 0004 also serves the contribution grid.** It runs
  in the same process behind the same nginx proxy, with the token as a Coolify
  secret.
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
