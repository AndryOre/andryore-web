import path from 'node:path'
import type { APIRoute } from 'astro'

import { pageRoutesFromFiles } from '../i18n/parity'
import { englishProductKeys, productPath } from '../lib/products'
import { logEntryPath } from '../log/entries'
import { buildSitemap, readLastmod } from '../seo/sitemap'

export const GET: APIRoute = () => {
  const files = Object.keys(import.meta.glob('./**/*.astro')).map((file) =>
    file.replace(/^\.\//, ''),
  )
  const products = englishProductKeys(
    Object.keys(import.meta.glob('../content/products/*.md')),
  ).map((key) => productPath('en', key))
  const logEntries = Object.keys(
    import.meta.glob('../content/log/en/*.md'),
  ).map((file) => logEntryPath('en', path.basename(file, '.md')))
  const body = buildSitemap(
    [...pageRoutesFromFiles(files).en, ...products, ...logEntries],
    readLastmod(import.meta.env.SITE_LASTMOD ?? process.env.SITE_LASTMOD),
  )
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
