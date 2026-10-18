# 0018: The Site has no Log

## Status

Accepted. Amends [0002](0002-bilingual-parity.md),
[0003](0003-static-astro-on-coolify.md) and [0007](0007-split-license.md).

Date: 2026-10-18

## Context

The Site launched with a Log, a short dated record of what Andry builds, and a
Status block of hand-written rows. Andry does not write a blog and does not want
to maintain either one; the launch entries only described the Site itself.

## Decision

- **The Site has no Log and no Status block.** The routes, content collection,
  home tiles and dock item are removed. `/log` returns the 404 page.
- **The parity rule in 0002 now covers every page**, including product pages.
  Wherever 0002, 0003 and 0007 say "Log entry" or "the Log", read "page".
- Fresh activity comes from the live tiles (stream, GitHub), not from written
  entries.

### Rejected alternatives

- **Keeping an empty Log**: a promise the Site does not keep.
- **A releases feed in place of the Log**: Andry declined it for now.

## Consequences

- Links to `/log` stop working; there is no destination to redirect to.
- A writing surface can come back later through a new ADR.
