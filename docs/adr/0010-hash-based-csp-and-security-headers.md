# 0010: Hash-based CSP and security headers

## Status

Accepted. Extends [0003](0003-static-astro-on-coolify.md) and
[0009](0009-no-third-party-requests.md). Amended by
[0012](0012-csp-delivered-as-an-nginx-header.md): the policy is delivered as an
nginx header, not only a meta tag.

Date: 2026-10-17

## Context

The Site is static and serves no third-party content (0009), so a strict Content
Security Policy is cheap to adopt now and expensive to retrofit. Astro can emit
a CSP with hashes for the scripts and styles it generates. AFE's site runs a
hash-based policy plus a hardened nginx header set, and checks it with a
container smoke test.

## Decision

- **Astro's `security.csp` emits a hash-based policy.** `script-src` lists
  hashes only; there is no `unsafe-inline`, no `unsafe-eval` and no
  `wasm-unsafe-eval`. `default-src` is `'none'`, with `base-uri` and
  `form-action` set to `'none'`.
- **Inline scripts carry a computed hash.** The theme-init script's sha256 is
  derived from its source string at build time and covered by a test, so editing
  the script cannot silently break the policy.
- **nginx sets the transport and isolation headers**: HSTS, COOP, CORP,
  Permissions-Policy and Referrer-Policy, immutable caching for `/_astro/`, and
  masked client IPs in logs.
- **A container smoke test enforces it**: it checks the headers, the CSP, the
  redirects and the 404 against the built image.

### Rejected alternatives

- **`unsafe-inline` for styles or scripts**: removes most of the policy's value.
- **Headers only at Cloudflare**: splits the policy from the image that is
  tested; the nginx config travels with the build.

## Consequences

- Every new inline script needs a hash; the build fails if it drifts.
- The deploy ticket ships the nginx header config and the smoke test.
