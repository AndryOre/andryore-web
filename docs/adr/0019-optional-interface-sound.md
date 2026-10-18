# 0019: Optional interface sound

## Status

Proposed. The audio files never enter the public repository; the owner still has
to pick where the private source lives.

Date: 2026-10-18

## Context

Andry wants subtle, premium interface sounds on hover, click, switches, theme
changes, copying the email, downloading the CV, the stream going live and the
404 emoji. The chosen set is the Epidemic Sound "Glass" family: seven short
files, about 60 KB in total.

Two constraints apply. [0009](0009-no-third-party-requests.md) forbids any
request to another origin, so the files must be self-hosted. This repository is
public, and an Epidemic Sound licence normally covers the licensee's own videos,
streams and channels, not redistributing the audio files themselves. Epidemic
Sound's end-user terms bar making the files available to third parties "on a
stand-alone basis" and repackaging them as "sound effects" or "sound libraries",
so committing them to a public repository would count as redistribution. Playing
them on the Site itself is the permitted use.

## Decision

- **Sound is optional and off by default.** One Sound switch, shown in the FX
  tile and in the dock, shares one stored value. Nothing plays before a click or
  key press, on scroll, or while the tab is hidden. Hover ticks play on pointer
  devices only.
- **One fixed set, no visitor choice of packs, no volume setting.** Volume is a
  fixed gain with a hard cap of about 0.3.
- **The audio files are never committed to this repository.** They are a private
  build input, ignored by Git, and only the deployed Site serves them. Without
  them the FX tile and the dock switch ship with the engine and the switch stays
  hidden, so a fresh clone and CI build and test without audio.
- **Open for the owner:** where the private source lives (private storage or a
  private repository fetched at build time with a secret), or whether to replace
  the set with CC0 sounds, which could be committed. Asking Epidemic Sound in
  writing is the only way to commit the files themselves.
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
- The build must tolerate missing audio and the Docker image needs a way to
  receive the private files.
- This ADR moves to Accepted when the owner picks the private source or CC0.
