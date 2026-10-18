import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { LOCALES, type Locale } from '../i18n/locales'
import home from './home.json'

const SOURCE_ROOT = path.resolve(import.meta.dir, '..')
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const pageSource = (locale: Locale): string =>
  readFileSync(
    path.join(
      SOURCE_ROOT,
      'pages',
      locale === 'en' ? 'index.astro' : 'es/index.astro',
    ),
    'utf8',
  )

const productKeys = (locale: Locale): string[] =>
  home[locale].products.items.map((item) => item.key)

const statusDates = (locale: Locale): string[] =>
  home[locale].status.rows.map((row) => row.date)

describe('home content', () => {
  for (const locale of LOCALES) {
    test(`${locale} status rows carry an ISO date`, () => {
      const dates = statusDates(locale)
      expect(dates.length).toBeGreaterThan(0)
      for (const date of dates) expect(date).toMatch(ISO_DATE)
    })

    test(`${locale} status rows are flagged and products are real`, () => {
      const rows = home[locale].status.rows
      const products = home[locale].products.items
      expect(rows.every((row) => row.sample)).toBe(true)
      expect(products.every((product) => !product.sample)).toBe(true)
      expect(products.every((product) => product.year === '2024')).toBe(true)
      expect(products.every((product) => product.stateKind === 'shipped')).toBe(
        true,
      )
    })

    test(`${locale} contribution row is JSON Flow with a dated figure`, () => {
      const row = home[locale].products.contribution
      expect(row.key).toBe('json-flow')
      expect(row.tag).toMatch(/ · /)
      expect(row.metaDate).toMatch(ISO_DATE)
      expect(row.meta).toMatch(/^75[.,]000\+/)
      expect(row.href).toStartWith('https://')
      expect(row.year).toBe('2024–25')
      expect(row.description).not.toMatch(/commit/i)
    })

    test(`${locale} meta text stays within the limits`, () => {
      const { title, description } = home[locale].meta
      expect(title.length).toBeLessThanOrEqual(60)
      expect(description.length).toBeLessThanOrEqual(160)
    })
  }

  test('both languages list the same products in the same order', () => {
    expect(productKeys('es')).toEqual(productKeys('en'))
    expect(productKeys('en')).toEqual(['snug', 'animated-fluent-emojis'])
  })

  test('the contribution row is the same in both languages', () => {
    const { en, es } = home
    expect(es.products.contribution.key).toBe(en.products.contribution.key)
    expect(es.products.contribution.href).toBe(en.products.contribution.href)
    expect(es.products.contribution.path).toBe(en.products.contribution.path)
  })

  test('both languages list the same status rows by date', () => {
    expect(statusDates('es')).toEqual(statusDates('en'))
  })

  test('StreamBoss is not shown', () => {
    expect(JSON.stringify(home).toLowerCase()).not.toContain('streamboss')
  })
})

describe('home routes', () => {
  for (const locale of LOCALES) {
    test(`the ${locale} page renders the bento`, () => {
      const source = pageSource(locale)
      expect(source).toContain(`<HomeBento locale="${locale}">`)
      expect(source).toContain(`locale="${locale}" wide`)
      expect(source).not.toContain('noindex')
    })
  }
})
