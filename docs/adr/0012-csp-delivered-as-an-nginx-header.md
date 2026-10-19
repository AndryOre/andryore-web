# 0012: CSP delivered as an nginx header

## Status

Accepted. Amends [0010](0010-hash-based-csp-and-security-headers.md).

Date: 2026-10-17

Revised: 2026-10-19, both X-Frame-Options and frame-ancestors are sent

## Context

0010 chose Astro's `security.csp`, which emits the policy in a `<meta>` tag. A
meta policy cannot carry `frame-ancestors`, and browsers ignore
`require-trusted-types-for` there, so the strongest parts of the policy would be
missing. Snug solved it by rendering the policy into an nginx header at image
build time and checking the built pages against it.

## Decision

- **The policy is an `add_header Content-Security-Policy` in the nginx config**,
  with `default-src 'none'`, `base-uri 'none'`, `form-action 'none'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests` and
  `require-trusted-types-for 'script'`. Astro's meta policy stays as a fallback
  for `astro preview`.
- **The script hashes are rendered into the header at image build time.** A
  script reads every built page, hashes each executable inline script (`sha256`,
  base64), collects the hashes in Astro's meta policy, and writes them into the
  header template's placeholder.
- **The build fails if an executable inline script has no hash** in the meta
  policy, so a new inline script can never ship unprotected.
- **Nothing in 0010 is relaxed**: no `unsafe-inline`, no `unsafe-eval`, no
  `wasm-unsafe-eval`, for scripts or for styles.
- **The container smoke test asserts the header** on the built image: the exact
  directives above, no `unsafe-*`, and no `http(s)://` origin other than those
  an ADR allows.

### Rejected alternatives

- **Meta tag only**: cannot express `frame-ancestors` or Trusted Types.
- **`X-Frame-Options: DENY` instead of `frame-ancestors`**: blocks framing but
  gives no Trusted Types and leaves two overlapping mechanisms.
- **A hand-maintained hash list in the nginx config**: drifts the first time a
  script changes.

## Consequences

- The header template, the render script and the smoke assertions ship together.
- The theme-init script's hash is covered twice: by its own test (0010) and by
  the build check.
- nginx sends both `frame-ancestors 'none'` in the CSP and
  `X-Frame-Options: DENY`; the second is a legacy fallback for old browsers.
- `docs/adr/0010` keeps its decisions; this ADR replaces only the delivery
  mechanism.
