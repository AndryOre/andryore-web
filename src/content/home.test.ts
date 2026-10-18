import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { LOCALES, type Locale } from '../i18n/locales'
import home from './home.json'

const SOURCE_ROOT = path.resolve(import.meta.dir, '..')

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

describe('home content', () => {
  for (const locale of LOCALES) {
    test(`${locale} products are real and shipped`, () => {
      const products = home[locale].products.items
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
      expect(row.metaDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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

  test('the hero links the products anchor and has no Log or Status tile', () => {
    for (const locale of LOCALES) {
      expect(home[locale].hero.primary.path).toBe('/#products')
      expect(Object.keys(home[locale])).not.toContain('status')
      expect(Object.keys(home[locale])).not.toContain('recent')
    }
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
