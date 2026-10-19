# 0009: No third-party requests from the Site

## Status

Accepted. Extends [0003](0003-static-astro-on-coolify.md). Amended by
[0010](0010-hash-based-csp-and-security-headers.md): the CSP. Partly superseded
by [0014](0014-umami-cloud-cookieless-analytics.md): one cookieless analytics
script is allowed. Amended by
[0017](0017-github-contributions-via-runtime-endpoint.md): the contribution grid
is fetched same-origin at runtime. Amended by
[0020](0020-external-links-open-in-a-new-tab.md): external links also carry
`target`.

Date: 2026-10-17

Revised: 2026-10-19, runtime exceptions, same-origin grid fetch and the `target`
rule (0017, 0020).

Revised: 2026-10-19, Snug's site allows the Umami Cloud script, so it is not a
site with no third-party requests.

## Context

The Site is a static, text-first build (0003) with a Lighthouse 90 gate. The
Animated Fluent Emojis site already runs with no third-party requests, and
Snug's site allows only its cookieless Umami Cloud script: fonts are
self-hosted, and a build-output audit fails the build if a page reaches another
origin. Every third-party request adds latency, a privacy footprint and a
supply-chain dependency that a personal site does not need.

## Decision

- **Pages make no requests to third-party origins.** Fonts are self-hosted
  (`@fontsource-variable/*`), images and icons are local, and there are no
  third-party scripts, embeds or analytics.
- **Outbound links are links, not loads.** Every external `<a>` carries
  `rel="noopener noreferrer"` and `target="_blank"` (0020).
- **A build-output audit enforces it.** The browser quality gates scan `dist/`
  for third-party URLs in `src`, `href` (stylesheets, preloads) and inline CSS,
  and for external links missing `rel`.
- **The runtime exceptions are server-side only.** The Twitch live status (0004)
  and the GitHub contribution grid (0017) are served by the Site's own endpoint;
  the browser calls only the Site's own origin, never Twitch or GitHub.

### Rejected alternatives

- **Google Fonts or a font CDN**: convenient, but a third-party request on every
  first visit.
- **Third-party analytics**: not needed for a personal site, and it would weaken
  the privacy posture.

## Consequences

- Open Graph images are generated at build time. The contribution grid is
  fetched same-origin from the runtime endpoint (0017); the build copy is only
  the fallback. Neither is loaded from another origin by the browser.
- A new dependency that loads remote assets fails the audit and needs a new ADR.
