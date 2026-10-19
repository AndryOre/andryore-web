# 0002: Every page exists in English and Spanish

## Status

Accepted. Amended by [0013](0013-ai-crawler-policy.md): crawler policy. Amended
by [0018](0018-the-site-has-no-log.md): the Log is gone.

Date: 2026-10-16

Revised: 2026-10-19, the Log no longer exists, so entries are dropped.

## Context

Profiles and bios are in English while the content is spoken Spanish with
English subtitles, and the audience reads both. The site had to pick between one
language per page, a default language with partial translation, or full parity.

## Decision

- **Every page exists in English and Spanish.** English is the source copy and
  lives at `/`; Spanish lives under `/es/`.
- A visible language switch links to the same page in the other language, with
  `hreflang` and a canonical per language. There is no automatic redirect by
  browser language.
- A build must fail when a page is missing its pair.

### Rejected alternatives

- **Pages in one language only**: simpler to publish, but half the site is
  invisible to each reader and the switch would land on empty pages.
- **Automatic redirect by `Accept-Language`**: breaks caching and shared links,
  and surprises people who read in the other language.

## Consequences

- Publishing a page costs writing it twice.
- The voice guide needs a note for the Spanish register (neutral Latin American,
  no voseo).
