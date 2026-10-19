# 0014: Umami Cloud cookieless analytics

## Status

Accepted. Partly supersedes [0009](0009-no-third-party-requests.md), for
analytics only.

Date: 2026-10-17

Revised: 2026-10-19, reworded a historical ticket mention

## Context

0009 forbids third-party scripts and analytics. Server logs count requests, not
people, and say nothing about which links, language or theme switches visitors
use. Snug made the same trade in its ADR 0017: one cookieless analytics script,
a strict CSP and a privacy note. The owner asked for what Snug has.

## Decision

- **The Site loads one script from Umami Cloud** (Hobby plan). Umami is
  cookieless: it sets no cookies and stores nothing in the browser.
- **The tracker respects privacy by configuration.** It runs with
  `data-do-not-track="true"` so visitors who send Do Not Track are not counted,
  and `data-domains="andryore.dev"` so previews and local builds are not
  counted.
- **Events are attribute-only**: `data-umami-event` with kebab-case names and
  locale-independent property values. No custom tracking code.
- **The CSP stays strict.** `script-src` adds only `https://cloud.umami.is` and
  `connect-src` adds only `https://gateway.umami.is`. There is no
  `unsafe-inline` and no `unsafe-eval` (0010, 0012).
- **The audit allowlists exactly those two origins.** The build-output audit
  (0009) and the container smoke test accept them and fail on any other
  third-party origin.
- **A privacy note, in both languages, names Umami as the processor** and lists
  what is collected.
- **nginx keeps masked-IP access logs** as an ad-block-proof cross-check.

### Rejected alternatives

- **Log-only measurement**: nothing leaves the Site, but there are no click
  events.
- **Self-hosted Umami or GoatCounter**: no processor, but one more service to
  run and patch.
- **PostHog**: autocapture and session replay on by default, and a much larger
  script.
- **Cloudflare Web Analytics**: no custom events.

## Consequences

- The Site makes one third-party script request on load, plus the collect call.
  0009 stands for everything else; any other third-party script needs a new ADR.
- Blockers hide some visitors, so Umami undercounts. The nginx log is the
  cross-check.
- The privacy note must keep matching what the tracker collects. Its copy needs
  the owner's approval (0007).
- The layout change, the events, the privacy note and the CSP test belong to the
  analytics work. The owner creates the Umami site and provides its website ID.
