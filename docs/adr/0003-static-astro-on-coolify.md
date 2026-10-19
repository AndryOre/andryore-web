# 0003: Static Astro site deployed on Coolify

## Status

Accepted. Amended by [0004](0004-live-status-endpoint.md): one runtime endpoint
for the Twitch live status. Amended by
[0006](0006-tailwind-and-shadcn-islands.md): Tailwind v4 and shadcn/ui as
islands. Amended by [0009](0009-no-third-party-requests.md): no third-party
requests. Amended by [0010](0010-hash-based-csp-and-security-headers.md):
hash-based CSP. Amended by [0018](0018-the-site-has-no-log.md): the Log is gone.

Date: 2026-10-16

Revised: 2026-10-19, dropped the Log, and corrected the no-server-code claim for
the runtime endpoints.

## Context

A review of reference sites found that the references scoring 95 to 100 in
Lighthouse are static and text-first, and nothing in the Site needs live data or
server rendering. Andry already runs Coolify and manages DNS on Cloudflare.

## Decision

- **The Site is a static Astro build**, with Markdown content collections for
  the products.
- **It is deployed on Coolify** from this repository's `main`; **DNS lives on
  Cloudflare**.

### Not chosen

- **Next.js**: a heavier runtime for content that never changes per request.
- **Hosted static platforms (Cloudflare Pages, Vercel)**: workable, but Andry
  already operates Coolify and wants a single place for deploys.

## Consequences

- Pages are static, so there is no per-request server code to secure or scale
  beyond the runtime endpoint (0004, 0017); the page budget is a build-time
  check.
- Deploys depend on Andry's Coolify host being up.
