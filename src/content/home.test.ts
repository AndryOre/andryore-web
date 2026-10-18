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
    test(`${locale} sample products are flagged for review`, () => {
      const products = home[locale].products.items
      expect(products.every((product) => product.sample)).toBe(true)
      expect(products.every((product) => product.year !== '')).toBe(true)
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
