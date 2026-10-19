# 0006: Tailwind v4 and shadcn/ui, as islands

## Status

Accepted. Amends [0003](0003-static-astro-on-coolify.md).

Date: 2026-10-16

Revised: 2026-10-19, the island list is now an example, not exhaustive.

## Context

The Site is a static Astro build (0003). Snug's site and Andry's other projects
use Tailwind CSS v4 and shadcn/ui, and the Dock and the theme toggle need
accessible interactive primitives (tooltips, menus, focus handling) that are
costly to hand-roll.

## Decision

- **Tailwind CSS v4 styles the Site**, with the brand tokens from
  `docs/brand/tokens.css` mapped into `@theme` unchanged.
- **shadcn/ui components are React islands**, used only where interaction needs
  them (for example the Dock, the theme toggle, the CV split button and the
  copy-email button). Everything else is plain Astro and ships no JavaScript.
- **`@shadcn/lint` is on**, with Snug's escalation ladder: use an existing
  variant, add a variant, add a contract, and only then a one-line disable with
  a reason.
- **The Lighthouse 90 gate (all four categories) still applies**, so islands are
  measured, not assumed free.

### Rejected alternatives

- **Hand-written CSS and vanilla JS only**: lighter, but re-implements
  accessible primitives the Dock needs.
- **React for every page**: pays a runtime cost on content that never changes
  per request, against 0003.

## Consequences

- The scaffold ticket adds `@astrojs/react`, Tailwind and shadcn.
- Interactive pieces are small, named islands; the rest stays static.
