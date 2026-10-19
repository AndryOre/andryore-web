# Architecture

This document describes the shape of the codebase, not its API. It is allowed to
go stale in the details as the code moves, so treat it as a map and not as a
contract. It names files and symbols instead of linking to them, because links
rot and names mostly don't. Terms such as the Site follow
[`CONTEXT.md`](../CONTEXT.md). For the security side see
[`security.md`](security.md).

## Bird's-eye view

The Site is the personal site [andryore.dev](https://andryore.dev): a static
Astro build in English and Spanish
([ADR 0003](adr/0003-static-astro-on-coolify.md)). Pages are `.astro` files, the
product pages come from a Markdown content collection, and a React island is
used only where the UI needs client behaviour
([ADR 0006](adr/0006-tailwind-and-shadcn-islands.md)). One Docker image serves
it: nginx hands out the built files, and a small Bun process behind the same
nginx answers two live endpoints, the Twitch stream status and the GitHub
contribution grid ([ADR 0004](adr/0004-live-status-endpoint.md),
[ADR 0017](adr/0017-github-contributions-via-runtime-endpoint.md)). Coolify
builds that image from the repository and deploys it.

The browser only ever talks to the Site's own origin, apart from the one
cookieless analytics script ([ADR 0009](adr/0009-no-third-party-requests.md),
[ADR 0014](adr/0014-umami-cloud-cookieless-analytics.md)). Twitch and GitHub are
called server side, with credentials that live in an encrypted env file
([ADR 0022](adr/0022-secrets-in-dotenvx-encrypted-env-files.md)).

## Code map

The repository is a single bun package. The tooling (husky, commitlint,
prettier, eslint, knip) sits at the root, and the Site is under `src/`. Every
path below is relative to the repository root.

### `src/content/`

The copy and the data, kept out of components
([ADR 0002](adr/0002-bilingual-parity.md)). Each page or section has a JSON file
(`home.json`, `about.json`, `uses.json`, `chrome.json`, `find-me.json`,
`live-tiles.json`, `not-found.json` and so on) holding both languages.
`products/` holds the product pages as Markdown, one `<key>.en.md` and one
`<key>.es.md` per product. `github-grid.json` is the build capture of the GitHub
contribution grid, kept as the fallback for the live endpoint. The collection is
declared in `src/content.config.ts`, with its schema built by
`createProductSchema` in `src/lib/products.ts`.

### `src/i18n/`

Everything about the two languages. `locales.ts` defines `LOCALES`,
`DEFAULT_LOCALE`, the path helpers (`localePath`, `splitLocalePath`,
`alternatesFor`, `absoluteUrl`) and the `hreflang` codes. `parity.ts`,
`parity-check.ts` and `translated-entries.ts` compare the two languages: missing
page pairs, missing entry pairs, missing or unused message keys, copy lint and
stale translations (`translations.ts` hashes the source body of each entry).
`parity-integration.ts` runs the check as an Astro integration and fails the
build with every problem listed. `preference.ts` remembers the language the
reader chose in the browser.

### `src/lib/`

Plain TypeScript with no Astro dependency, so it is easy to test. The domain
modules: `twitch-status.ts` and `github-contributions.ts` (the two runtime
endpoints' logic), `github-grid*.ts` and `github-stats.ts` (the contribution
grid), `products.ts`, `analytics.ts` (the Umami constants and event names), the
theme modules (`theme*.ts`), the dock, the sound engine and the visual effects
stores. Components import from here instead of holding logic.

### `src/server/`

`stream-status-server.ts` is the runtime sidecar. It starts `Bun.serve` on
`PORT` (3000 by default) with two routes, `/api/stream-status` and
`/api/github-contributions`, and answers 404 to everything else. It only wires
the credentials into the readers from `src/lib/`; the logic and its caches live
there. The Dockerfile compiles it into a single binary with
`bun build --compile`.

### `src/seo/`

The pure builders behind the generated files and the head: `sitemap.ts`
(`buildSitemap`, `readLastmod`), `robots.ts` and `crawlers.ts` (the AI crawler
lists, [ADR 0013](adr/0013-ai-crawler-policy.md)), `llms.ts`,
`structured-data.ts` (JSON-LD) and `metadata.ts` (title and Open Graph tags).

### `src/pages/`

One route per page. `index.astro`, `about.astro`, `uses.astro` and `404.astro`
are the English pages, and `src/pages/es/` mirrors them. `products/[key].astro`
and `es/products/[key].astro` render the product pages from the content
collection. `robots.txt.ts`, `sitemap.xml.ts` and `llms.txt.ts` are endpoints
that call the builders in `src/seo/`. Pages hold almost no markup: they pick the
locale and hand the copy to a component.

### `src/components/` and `src/layouts/`

`BaseLayout.astro` is the one layout: head, metadata, the CSP meta fallback and
the shared chrome. Page bodies are Astro components (`HomeBento.astro`,
`AboutPage.astro`, `UsesPage.astro`, `ProductPage.astro`, `NotFoundPage.astro`
and the tile components). The React islands are `Dock.tsx`, `ThemeSlider.tsx`,
`ThemeToggle.tsx`, `CvSplitButton.tsx` and `CopyEmailButton.tsx`, and
`components/ui/` holds the shadcn/ui primitives they build on.

### `src/scripts/` and `src/styles/`

`src/scripts/` has the client scripts that wire tiles and effects
(`stream-tile.ts`, `github-tile.ts`, `clock-tile.ts`, `theme-init.ts` and so
on). `theme-init.ts` is the one inline script, and its sha256 is exported as
`THEME_INIT_SCRIPT_HASH` for the CSP. `interaction-integration.ts` is an Astro
integration that adds the `client:interaction` directive, so an island hydrates
on the first pointer, focus or touch interaction. `src/styles/global.css` holds
the Tailwind entry and the tokens.

### Outside `src/`

- `docker/` holds the runtime image's nginx files (see Runtime).
- `scripts/` holds repo scripts: `render-csp.ts` (the CSP header),
  `fetch-sounds.ts` (the optional interface sound,
  [ADR 0019](adr/0019-optional-interface-sound.md)), `update-github-grid.ts`
  (refreshes the build capture), the audits (`audit-distribution.ts`,
  `lighthouse-budget.ts`) and the commit and docs linters.
- `docs/` holds the ADRs, the brand assets, the agent specifics and the guides.
- `eslint-rules/` holds the local ESLint rules.
- `e2e/` holds the Playwright tests.

## Runtime

The `Dockerfile` has two stages. The build stage runs on `oven/bun`: it installs
dependencies, fetches the sound files, runs `bun run build`, renders the CSP
header from the built pages (`scripts/render-csp.ts`) and compiles the
stream-status server. The final stage is `nginx:1.29-alpine` and copies in the
built `dist/`, the rendered `security-headers.conf`, the compiled server and the
`docker/` files.

- `docker/nginx.conf` is the main nginx config: gzip, a Markdown MIME type, no
  server tokens.
- `docker/site.conf` is the server block. It redirects `www.andryore.dev` to the
  apex, serves the static files, proxies the two `/api/` routes to the Bun
  process on `127.0.0.1:3000`, sets immutable caching for `/_astro/` and
  `/fonts/` and `no-cache` for pages, and logs client addresses masked.
- `docker/security-headers.conf.template` is the template the CSP and the other
  security headers are rendered from. Every location includes the rendered
  snippet.
- `docker/entrypoint.sh` starts the stream-status server as the `nginx` user in
  the background, then runs nginx in the foreground.

Pages are static, so the only per-request code is the sidecar. Each endpoint
caches its answer in memory, the stream status for 60 seconds and the
contributions for one hour, and degrades instead of failing: the stream tile
shows offline, and the GitHub tile keeps the build capture.

## i18n routing

English is the source language and lives at `/`. Spanish lives under `/es/`, as
a second file tree under `src/pages/es/` and a second file per product
(`.es.md`). There is no redirect by browser language
([ADR 0002](adr/0002-bilingual-parity.md)): the language switch links to the
same page in the other language, each page carries `hreflang` alternates and a
canonical per language, and the reader's choice is only remembered.
`trailingSlash` is `'always'` in `astro.config.mjs`, and nginx resolves
`index.html` per directory, with a Spanish 404 served under `/es/`.

## Invariants

- **Bilingual parity.** Every page and product exists in both languages with the
  same message keys, and the build fails when it does not
  ([ADR 0002](adr/0002-bilingual-parity.md)). Copy lives in `src/content/`,
  never in components.
- **Static pages, two runtime routes.** Nothing renders per request except
  `/api/stream-status` and `/api/github-contributions`
  ([ADR 0003](adr/0003-static-astro-on-coolify.md),
  [ADR 0004](adr/0004-live-status-endpoint.md),
  [ADR 0017](adr/0017-github-contributions-via-runtime-endpoint.md)).
- **The browser calls only the Site's origin.** No fonts, embeds or scripts from
  elsewhere, apart from the one Umami Cloud script
  ([ADR 0009](adr/0009-no-third-party-requests.md),
  [ADR 0014](adr/0014-umami-cloud-cookieless-analytics.md)).
- **The CSP is an nginx header with hashes computed at build time.** No
  `unsafe-inline` and no `unsafe-eval`
  ([ADR 0010](adr/0010-hash-based-csp-and-security-headers.md),
  [ADR 0012](adr/0012-csp-delivered-as-an-nginx-header.md)).
- **Credentials are never plaintext in the repository.** They are encrypted with
  dotenvx, and Coolify holds only the private key
  ([ADR 0022](adr/0022-secrets-in-dotenvx-encrypted-env-files.md)).
- **Islands only for real interactivity**
  ([ADR 0006](adr/0006-tailwind-and-shadcn-islands.md)).
- **Code comments are TSDoc blocks only**
  ([ADR 0005](adr/0005-tsdoc-only-code-comments.md)).
