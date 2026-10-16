# 0002: Every page and Log entry exists in English and Spanish

## Status

Accepted

Date: 2026-10-16

## Context

Profiles and bios are in English while the content is spoken Spanish with
English subtitles, and the audience reads both. The site had to pick between one
language per entry, a default language with partial translation, or full parity.

## Decision

- **Every page and every Log entry exists in English and Spanish.** English is
  the source copy and lives at `/`; Spanish lives under `/es/`.
- A visible language switch links to the same page in the other language, with
  `hreflang` and a canonical per language. There is no automatic redirect by
  browser language.
- A build must fail when an entry or page is missing its pair.

### Rejected alternatives

- **Entries in one language only**: simpler to publish, but half the site is
  invisible to each reader and the switch would land on empty pages.
- **Automatic redirect by `Accept-Language`**: breaks caching and shared links,
  and surprises people who read in the other language.

## Consequences

- Publishing a Log entry costs writing it twice.
- The voice guide needs a note for the Spanish register (neutral Latin American,
  no voseo).
