# 0019: Optional interface sound

## Status

Accepted. The audio files never enter the public repository; they live in a
private GitHub repository and are fetched at build time. Amended by
[0021](0021-stack-scroll-sound.md): the Stack scene plays a scroll sound.
Amended by [0022](0022-secrets-in-dotenvx-encrypted-env-files.md): the token
lives in an encrypted env file.

Date: 2026-10-18

Revised: 2026-10-19, one Coolify application with the sounds_token secret only,
0021 link, licence confirmed

Revised: 2026-10-20, the token is `SOUNDS_TOKEN` in the encrypted env file
(0022)

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
- **The private source is a private GitHub repository.** Its `sounds/` folder
  holds the seven files and a `manifest.json` (`{"sounds": [...]}`).
  `scripts/fetch-sounds.ts` downloads it into the gitignored `public/sounds/`
  during the Docker build, using a read-only fine-grained token, `SOUNDS_TOKEN`,
  from the encrypted env file
  ([0022](0022-secrets-in-dotenvx-encrypted-env-files.md)). The Dockerfile
  defaults the build args `SOUNDS_REPO` and `SOUNDS_REF`. Without a token the
  script exits 0 and the Site builds without audio, so CI, `astro preview` and
  local builds are unaffected. The token never reaches an image layer or the
  logs.
- **Availability is checked at runtime.** The engine loads
  `/sounds/manifest.json` once; when it is missing or malformed the Sound switch
  and the FX tile stay hidden.
- **Licence caveat.** Epidemic Sound bars standalone redistribution of the
  files. Serving them on the Site is the permitted use, but the owner confirms
  this with Epidemic Sound in writing. The confirmation is done (Linear
  AO-2126).
- **Fallback.** If the licence check fails, replace the private set with the CC0
  Kenney Interface Sounds. Because those are CC0 they could then be committed,
  and this ADR would be superseded.
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
- The Coolify application needs only the `DOTENV_PRIVATE_KEY` build secret;
  Coolify drops build args when build secrets are on, so the Dockerfile defaults
  `SOUNDS_REPO` and `SOUNDS_REF`
  ([Sound files](../development.md#sound-files-and-credentials)).
