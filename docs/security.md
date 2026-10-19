# Security

This document is the Site's assurance case: what it loads, what it sends, how
the policy is built and delivered, and where the defenses fall short today. It
is written for visitors, reviewers and security researchers. Terms such as the
Site follow [`CONTEXT.md`](../CONTEXT.md).

To report a vulnerability, see [`.github/SECURITY.md`](../.github/SECURITY.md).
This document is about the design, not the reporting process. For the shape of
the code see [`architecture.md`](architecture.md).

## What visitors can expect

**Static pages and no cookies.** The Site is a static Astro build served by
nginx ([ADR 0003](adr/0003-static-astro-on-coolify.md)). Pages set no cookies
and collect nothing beyond the cookieless analytics described below
([ADR 0014](adr/0014-umami-cloud-cookieless-analytics.md)). nginx logs client
addresses masked: the last IPv4 octet is zeroed and IPv6 addresses are cut to
their first three groups.

**No third-party requests.** Pages make no requests to other origins
([ADR 0009](adr/0009-no-third-party-requests.md)). Fonts are self-hosted, images
and icons are local, and there are no embeds. The single exception is the Umami
Cloud tracker, allowed by
[ADR 0014](adr/0014-umami-cloud-cookieless-analytics.md): its script origin is
in `script-src` and its gateway in `connect-src`, and nothing else is. The
browser quality gates scan the build output for third-party URLs and for
external links missing `rel`, and a new dependency that loads remote assets
fails that audit and needs a new ADR. Outbound links are links, not loads, and
carry `rel="noopener noreferrer"` and `target="_blank"`
([ADR 0020](adr/0020-external-links-open-in-a-new-tab.md)).

## Content Security Policy

The policy is hash-based: there is no `unsafe-inline`, no `unsafe-eval` and no
`wasm-unsafe-eval`, for scripts or for styles
([ADR 0010](adr/0010-hash-based-csp-and-security-headers.md)). It is built in
three steps.

1. **Astro emits a meta policy at build time.** `security.csp` in
   `astro.config.mjs` lists `'self'` and the Umami script origin in
   `script-src`, adds the hash of the theme-init script, and sets `connect-src`
   and `manifest-src`. The theme-init script's sha256 is derived from its source
   string (`THEME_INIT_SCRIPT_HASH` in `src/scripts/theme-init.ts`) and covered
   by a test, so editing the script cannot silently break the policy.
2. **`scripts/render-csp.ts` renders the nginx header.** After the build, it
   reads every built page, hashes each executable inline script and style
   (`sha256`, base64), collects the hashes from Astro's meta policy and writes
   them into the placeholders of `docker/security-headers.conf.template`. The
   build fails if an executable inline script has no hash in the meta policy, so
   a new inline script can never ship unprotected
   ([ADR 0012](adr/0012-csp-delivered-as-an-nginx-header.md)).
3. **nginx sends the result as a header.** The rendered file is installed as an
   nginx snippet and included by every location in `docker/site.conf`. Astro's
   meta policy stays only as a fallback for `astro preview`, because a meta
   policy cannot carry `frame-ancestors` and browsers ignore
   `require-trusted-types-for` there.

The delivered policy is `default-src 'none'`, with explicit sources for scripts,
connections, the manifest, styles, images and fonts, `base-uri 'none'`,
`form-action 'none'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` and
`require-trusted-types-for 'script'`. The authoritative text is the template;
this document does not copy it.

## Security headers

Every location that serves content includes the same snippet, which also sets:

- `Strict-Transport-Security` for two years, with `includeSubDomains`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`, denying the sensor, camera, microphone, payment, USB and
  geolocation features the Site does not use.
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`, both
  `same-origin`.
- `X-Frame-Options: DENY`, a legacy fallback beside `frame-ancestors 'none'`.

nginx also hides its version (`server_tokens off`) and caches `/_astro/` and
`/fonts/` as immutable. The container smoke test (`scripts/smoke.sh`) checks the
headers, the CSP, the redirects and the 404 against the built image.

## The runtime endpoint

The Site is static apart from one small Bun process that nginx proxies to on
`127.0.0.1:3000` (`src/server/stream-status-server.ts`). It serves two routes
and answers everything else with 404:

- `/api/stream-status` returns whether the Twitch channel is live
  ([ADR 0004](adr/0004-live-status-endpoint.md)). It caches the answer for 60
  seconds and reports offline when Twitch cannot be reached.
- `/api/github-contributions` returns the GitHub contribution grid
  ([ADR 0017](adr/0017-github-contributions-via-runtime-endpoint.md)). It caches
  the answer in memory for one hour. When the token is missing or GitHub fails,
  it answers 503 and the tile keeps the build capture, labelled with its own
  date.

The browser calls only these two same-origin routes, never Twitch or GitHub, so
the CSP needs no extra `connect-src` for them. The credentials stay in the
server process and never reach the browser. Both routes are read-only `GET`
endpoints with no user input, so there is nothing for a visitor to inject.

## Secrets

The Site has four credentials: the Twitch client id and secret, a GitHub token
and a read-only token for the private sound repository. They are stored as
dotenvx-encrypted env files committed to the repository, and Coolify holds a
single value, the private key
([ADR 0022](adr/0022-secrets-in-dotenvx-encrypted-env-files.md)). The key
reaches the Docker build as a BuildKit secret, so it never enters an image
layer, and the stream-status server decrypts the file itself at startup. A
missing key or file means no credentials, and the endpoint behaves as it does
when a token is missing. A pre-commit guard refuses a plaintext env file or the
private keys file. The variables and the workflow get their own guide,
`docs/configuration.md`.

The repository is public, so the ciphertext stays in history forever and a
leaked key exposes every value ever committed. Andry accepts that risk. A key
leak is handled by rotating the Twitch secret and both tokens and then
re-encrypting; rotating only the key does not help.

Posture outside the code (rulesets, signed commits, SHA-pinned workflows, secret
scanning, private vulnerability reporting) is recorded in
[ADR 0011](adr/0011-public-repo-security-posture.md).

## Known limitations

- **The ciphertext is public history.** The encryption is the only barrier for
  credentials committed under
  [ADR 0022](adr/0022-secrets-in-dotenvx-encrypted-env-files.md).
- **One third-party script.** Umami Cloud is a processor outside the Site's
  control, and the policy trusts its origin in `script-src`.
- **Single maintainer, no backup reviewer.** There is no second maintainer to
  review security-relevant changes, a deliberate gap for a personal site (see
  [ADR 0011](adr/0011-public-repo-security-posture.md)).
- **The smoke test covers the image, not business logic.** It asserts headers
  and routes. Reviews of the endpoint code are manual, with CodeQL covering
  common vulnerability patterns.
