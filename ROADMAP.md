# Roadmap

This document describes the project's direction at a high level. It is reviewed
yearly; day-to-day planning happens in **Linear**, which is the source of truth
for what is actually being worked on next.

## Next 12 months

- **Launch the Site** — publish andryore.dev as a static Astro site on Coolify
  with the About page and the product pages, in English and Spanish with full
  parity; see [ADR 0002](docs/adr/0002-bilingual-parity.md) and
  [ADR 0003](docs/adr/0003-static-astro-on-coolify.md).
- **Live endpoint** — keep the runtime endpoint working and honest. It serves
  the Twitch live status and the GitHub contributions grid; see
  [ADR 0004](docs/adr/0004-live-status-endpoint.md) and
  [ADR 0017](docs/adr/0017-github-contributions-via-runtime-endpoint.md).
- **Product pages** — keep the pages for Snug, Animated Fluent Emojis and JSON
  Flow in step with the products.
- **Maintenance** — keep dependencies, tooling and CI current.
- **Bug fixes** — address defects as they are reported.

## Out of scope

The following are explicitly not planned:

- **Accepting content or brand contributions** — the brand assets under
  `docs/brand/` and the Site's content are not licensed for reuse; see
  [`LICENSE`](LICENSE) and [ADR 0007](docs/adr/0007-split-license.md).
- **Backend services and user accounts** — the Site is static, apart from the
  runtime endpoint.
- **Comments, newsletters and third-party trackers** — nothing that collects
  visitor data.

## Where planning actually happens

This roadmap is intentionally coarse. Concrete, scheduled work lives in Linear
(the AndryOre team, project "AndryOre Web"). Proposals from outside are welcome
as GitHub issues; being listed here would never be a promise that something
ships.
