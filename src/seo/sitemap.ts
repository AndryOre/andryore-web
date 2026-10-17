import {
  absoluteUrl,
  alternatesFor,
  DEFAULT_LOCALE,
  localePath,
  LOCALES,
} from '../i18n/locales'

const NOT_FOUND_PATH = '/404/'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates the build-time last-modified date. Coolify builds from a shallow
 * clone with no git history, so the date arrives as an env var.
 * @param raw The raw env value, normally `SITE_LASTMOD`.
 * @returns The `YYYY-MM-DD` date, or `undefined` so the sitemap omits `lastmod`
 *   rather than guessing.
 */
export function readLastmod(raw: string | undefined): string | undefined {
  return raw !== undefined && ISO_DATE.test(raw) ? raw : undefined
}

function urlEntry(
  locale: (typeof LOCALES)[number],
  path: string,
  lastmod: string | undefined,
): string {
  const links = [
    ...alternatesFor(path).map(
      (alternate) =>
        `<xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${absoluteUrl(alternate.path)}"/>`,
    ),
    `<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(localePath(DEFAULT_LOCALE, path))}"/>`,
  ]
  return [
    '  <url>',
    `    <loc>${absoluteUrl(localePath(locale, path))}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    ...links.map((link) => `    ${link}`),
    '  </url>',
  ].join('\n')
}

/**
 * Builds the language-aware sitemap: one `<url>` per page and language, each
 * carrying the full `hreflang` set including itself.
 * @param paths Locale-neutral page paths such as `/` and `/log/`.
 * @param lastmod Optional `YYYY-MM-DD` date stamped on every url.
 * @returns The sitemap XML.
 */
export function buildSitemap(
  paths: readonly string[],
  lastmod?: string,
): string {
  const entries = paths
    .filter((path) => path !== NOT_FOUND_PATH)
    .flatMap((path) => LOCALES.map((locale) => urlEntry(locale, path, lastmod)))
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
