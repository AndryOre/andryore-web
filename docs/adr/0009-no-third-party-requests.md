# 0009: No third-party requests from the Site

## Status

Accepted. Extends [0003](0003-static-astro-on-coolify.md).

Date: 2026-10-17

## Context

The Site is a static, text-first build (0003) with a Lighthouse 90 gate. Snug's
and Animated Fluent Emojis' sites already run with no third-party requests:
fonts are self-hosted, analytics is first-party or absent, and a build-output
audit fails the build if a page reaches another origin. Every third-party
request adds latency, a privacy footprint and a supply-chain dependency that a
personal site does not need.

## Decision

- **Pages make no requests to third-party origins.** Fonts are self-hosted
  (`@fontsource-variable/*`), images and icons are local, and there are no
  third-party scripts, embeds or analytics.
- **Outbound links are links, not loads.** Every external `<a>` carries
  `rel="noopener noreferrer"`.
- **A build-output audit enforces it.** The browser quality gates scan `dist/`
  for third-party URLs in `src`, `href` (stylesheets, preloads) and inline CSS,
  and for external links missing `rel`.
- **The one runtime exception is the Twitch live status endpoint** (0004), which
  is called by the Site's own server, never by the browser.

### Rejected alternatives

- **Google Fonts or a font CDN**: convenient, but a third-party request on every
  first visit.
- **Third-party analytics**: not needed for a personal site, and it would weaken
  the privacy posture.

## Consequences

- Open Graph images and the contribution grid are generated at build time from
  local or build-fetched data, never loaded by the browser.
- A new dependency that loads remote assets fails the audit and needs a new ADR.
