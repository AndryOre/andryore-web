import { describe, expect, test } from 'bun:test'

import { buildSitemap, readLastmod } from './sitemap'

describe('buildSitemap', () => {
  const xml = buildSitemap(['/', '/log/'], '2026-10-17')

  test('lists each page in both languages', () => {
    for (const loc of [
      'https://andryore.dev/',
      'https://andryore.dev/es/',
      'https://andryore.dev/log/',
      'https://andryore.dev/es/log/',
    ]) {
      expect(xml).toContain(`<loc>${loc}</loc>`)
    }
  })

  test('declares the xhtml namespace', () => {
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  })

  test('gives every url a self-referencing alternate set with x-default', () => {
    const spanishLog = xml.slice(
      xml.indexOf('<loc>https://andryore.dev/es/log/'),
    )
    expect(spanishLog).toContain(
      '<xhtml:link rel="alternate" hreflang="es" href="https://andryore.dev/es/log/"/>',
    )
    expect(spanishLog).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://andryore.dev/log/"/>',
    )
    expect(spanishLog).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://andryore.dev/log/"/>',
    )
  })

  test('stamps lastmod when given', () => {
    expect(xml.match(/<lastmod>2026-10-17<\/lastmod>/g)).toHaveLength(4)
  })

  test('omits lastmod without a date', () => {
    expect(buildSitemap(['/'])).not.toContain('lastmod')
  })
})

describe('readLastmod', () => {
  test('accepts an ISO date', () => {
    expect(readLastmod('2026-10-17')).toBe('2026-10-17')
  })

  test('falls back to nothing when missing or malformed', () => {
    expect(readLastmod(undefined)).toBeUndefined()
    expect(readLastmod('')).toBeUndefined()
    expect(readLastmod('yesterday')).toBeUndefined()
  })
})
