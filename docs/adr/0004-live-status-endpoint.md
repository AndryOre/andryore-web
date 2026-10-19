# 0004: One runtime endpoint for the Twitch live status

## Status

Accepted. Amends [0003](0003-static-astro-on-coolify.md). Amended by
[0017](0017-github-contributions-via-runtime-endpoint.md): the same endpoint
also serves the GitHub contribution grid. Amended by
[0022](0022-secrets-in-dotenvx-encrypted-env-files.md): the credentials live in
an encrypted env file, not as Coolify secrets.

Date: 2026-10-16

Revised: 2026-10-19, linked 0017, which extends the endpoint.

Revised: 2026-10-20, credentials moved to an encrypted env file (0022).

## Context

The Site is a static Astro build (0003). Andry wants the stream tile to show
whether the channel is online now. That needs a Twitch API call with a client
secret, and the answer changes minute to minute, so neither the browser nor the
build can provide it.

## Decision

- **The Site stays static, plus one small runtime endpoint** on the same Coolify
  host that returns the channel's online or offline state.
- The endpoint caches its answer for 60 seconds and returns "offline" when
  Twitch cannot be reached, so the tile never blocks or shows an error.
- Credentials never reach the browser. They are stored encrypted in the
  repository ([0022](0022-secrets-in-dotenvx-encrypted-env-files.md)).

### Rejected alternatives

- **Calling Twitch from the browser**: needs a client secret, which cannot ship
  to visitors.
- **Build-time only**: not live; the state would be stale until the next deploy.
- **A full server framework for the whole Site**: pays a runtime and security
  cost on every page to serve one tile.

## Consequences

- Deploy runs a small process as well as serving static files.
- The tile has three states to design: live, offline and unavailable.
