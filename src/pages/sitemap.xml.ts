import type { APIRoute } from 'astro'

import { pageRoutesFromFiles } from '../i18n/parity'
import { buildSitemap, readLastmod } from '../seo/sitemap'

export const GET: APIRoute = () => {
  const files = Object.keys(import.meta.glob('./**/*.astro')).map((file) =>
    file.replace(/^\.\//, ''),
  )
  const body = buildSitemap(
    pageRoutesFromFiles(files).en,
    readLastmod(import.meta.env.SITE_LASTMOD ?? process.env.SITE_LASTMOD),
  )
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
