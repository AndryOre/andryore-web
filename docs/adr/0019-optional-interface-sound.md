# 0019: Optional interface sound

## Status

Proposed. Needs the owner's decision on the audio licence before any audio file
is committed.

Date: 2026-10-18

## Context

Andry wants subtle, premium interface sounds on hover, click, switches, theme
changes, copying the email, downloading the CV, the stream going live and the
404 emoji. The chosen set is the Epidemic Sound "Glass" family: seven short
files, about 60 KB in total.

Two constraints apply. [0009](0009-no-third-party-requests.md) forbids any
request to another origin, so the files must be self-hosted. This repository is
public, and an Epidemic Sound licence normally covers the licensee's own videos,
streams and channels, not redistributing the audio files themselves. Committing
the files to a public repository could count as redistribution.

## Decision

- **Sound is optional and off by default.** One Sound switch, shown in the FX
  tile and in the dock, shares one stored value. Nothing plays before a click or
  key press, on scroll, or while the tab is hidden. Hover ticks play on pointer
  devices only.
- **One fixed set, no visitor choice of packs, no volume setting.** Volume is a
  fixed gain with a hard cap of about 0.3.
- **The audio files are not committed until the licence question is answered.**
  Until then the FX tile and the dock switch ship with the engine and no files,
  and the switch stays hidden.
- **When the licence is settled, one of these applies:** keep the files outside
  the public repository as a private build input; confirm in writing that the
  plan allows serving them from the Site; or replace them with CC0 sounds.
- **Delivery:** files are served from the Site's own origin and fetched under
  `connect-src 'self'`, so the CSP gains no new directive
  ([0010](0010-hash-based-csp-and-security-headers.md),
  [0012](0012-csp-delivered-as-an-nginx-header.md)).

### Rejected alternatives

- **Hotlinking Epidemic Sound's CDN**: a third-party request, forbidden by 0009.
- **Letting visitors pick a sound pack**: more surface than the Site needs.
- **Sound on by default**: unexpected audio is hostile.

## Consequences

- The FX tile and dock switch need a small client module with its own test.
- A visitor who never turns Sound on downloads no audio.
- This ADR moves to Accepted when the owner answers the licence question.
