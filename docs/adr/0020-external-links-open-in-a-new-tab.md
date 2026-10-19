# 0020: External links open in a new tab

## Status

Accepted. Amends [0009](0009-no-third-party-requests.md): its outbound-link rule
now also covers `target`.

Date: 2026-10-19

## Context

0009 only requires `rel="noopener noreferrer"` on external links. In practice
anchors were hand written: some had no `target`, some hardcoded `rel`, some used
`externalLinkTokens()`. Visitors who follow a GitHub or Twitch link lose their
place on the Site, and the build-output audit could not tell which links were
meant to leave.

## Decision

- **Every cross-origin `http(s)` link opens in a new tab** with
  `target="_blank"` and `rel="noopener noreferrer"`.
- **One helper decides.** `externalLinkAttributes(href)` in
  `src/lib/external-link.ts` returns `{ target, rel }` for those links and
  `undefined` for everything else. Anchors spread its result; none write
  `target` or `rel` by hand.
- **Exceptions stay in the same tab:** `mailto:`, `tel:`, `#` anchors, relative
  and same-origin links (including protocol-relative links to the Site's own
  host) and the language switch.
- **The new tab is announced.** A link with visible text carries the visually
  hidden `opensInNewTab` note from `src/content/chrome.json`; an icon-only link
  appends it inside its `aria-label`. The note exists in English and Spanish
  (0002).
- **The dist audit checks it.** `audit:dist` is extended to require `target` and
  the note, as well as `rel`, on external links.

## Consequences

- A new tab is a context change, so the note is required, not optional.
- Changing how external links behave is a one-file change.
- 0009's third-party request rule is unchanged.
