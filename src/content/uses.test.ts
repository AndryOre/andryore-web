import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { LOCALES, type Locale } from '../i18n/locales'
import { hasAffiliateRows } from '../lib/uses'
import chrome from './chrome.json'
import colophon from './colophon.json'
import uses from './uses.json'

const SOURCE_ROOT = path.resolve(import.meta.dir, '..')

const pageSource = (locale: Locale, name: string): string =>
  readFileSync(
    path.join(
      SOURCE_ROOT,
      'pages',
      locale === 'en' ? `${name}.astro` : `es/${name}.astro`,
    ),
    'utf8',
  )

const rowCounts = (locale: Locale): number[] =>
  uses[locale].categories.map((category) => category.rows.length)

describe('uses content', () => {
  for (const locale of LOCALES) {
    test(`${locale} sample rows are flagged`, () => {
      const rows = uses[locale].categories.flatMap((category) => category.rows)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.every((row) => row.sample)).toBe(true)
    })

    test(`${locale} affiliate rows only exist with a link`, () => {
      const rows = uses[locale].categories.flatMap((category) => category.rows)
      for (const row of rows) {
        if (row.affiliate) expect('url' in row).toBe(true)
      }
      expect(typeof hasAffiliateRows(uses[locale].categories)).toBe('boolean')
    })

    test(`${locale} meta text stays within the limits`, () => {
      const pages = [uses[locale], colophon[locale]]
      for (const { meta } of pages) {
        expect(meta.title.length).toBeLessThanOrEqual(60)
        expect(meta.description.length).toBeLessThanOrEqual(160)
      }
    })

    test(`${locale} footer links name both pages`, () => {
      expect(chrome[locale].usesLabel).not.toBe('')
      expect(chrome[locale].colophonLabel).not.toBe('')
    })
  }

  test('both languages have the same categories and row counts', () => {
    expect(rowCounts('es')).toEqual(rowCounts('en'))
  })

  test('colophon facts match the build', () => {
    const text = JSON.stringify(colophon.en)
    const manifest = readFileSync(
      path.resolve(SOURCE_ROOT, '..', 'package.json'),
      'utf8',
    )
    expect(text).toContain('Astro')
    expect(text).toContain('Space Grotesk')
    expect(text).toContain('JetBrains Mono')
    expect(manifest).toContain('@fontsource-variable/space-grotesk')
    expect(manifest).toContain('@fontsource-variable/jetbrains-mono')
    expect(text.toLowerCase()).not.toContain('tracking')
  })
})

describe('uses and colophon routes', () => {
  for (const locale of LOCALES) {
    for (const [name, component] of [
      ['uses', 'UsesPage'],
      ['colophon', 'ColophonPage'],
    ] as const) {
      test(`${locale} ${name} route renders its page for the locale`, () => {
        const source = pageSource(locale, name)
        expect(source).toContain(`${component}.astro`)
        expect(source).toContain(`locale="${locale}"`)
      })
    }
  }
})
