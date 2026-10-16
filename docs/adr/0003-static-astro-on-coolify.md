# 0003: Static Astro site deployed on Coolify

## Status

Accepted. Amended by [0004](0004-live-status-endpoint.md): one runtime endpoint
for the Twitch live status. Amended by
[0006](0006-tailwind-and-shadcn-islands.md): Tailwind v4 and shadcn/ui as
islands.

Date: 2026-10-16

## Context

A review of reference sites found that the references scoring 95 to 100 in
Lighthouse are static and text-first, and nothing in the Site needs live data or
server rendering. Andry already runs Coolify and manages DNS on Cloudflare.

## Decision

- **The Site is a static Astro build**, with Markdown content collections for
  the Log and the products.
- **It is deployed on Coolify** from this repository's `main`; **DNS lives on
  Cloudflare**.

### Not chosen

- **Next.js**: a heavier runtime for content that never changes per request.
- **Hosted static platforms (Cloudflare Pages, Vercel)**: workable, but Andry
  already operates Coolify and wants a single place for deploys.

## Consequences

- No server code to secure or scale; the page budget is a build-time check.
- Deploys depend on Andry's Coolify host being up.
