import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { LOCALES, type Locale } from '../i18n/locales'
import chrome from './chrome.json'
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

const sentence = (locale: Locale): string => {
  const { lead, emphasis, tail } = home[locale].hero
  return `${lead}${emphasis}${tail}`
}

describe('home v4 content', () => {
  test('the headline reads as one sentence and does not lead with payments', () => {
    expect(sentence('en')).toBe(
      'I build web platforms that hold up in production.',
    )
    expect(sentence('es')).toBe(
      'Construyo plataformas web que aguantan en producción.',
    )
    for (const locale of LOCALES) {
      expect(sentence(locale)).not.toMatch(/pay|pago/i)
    }
  })

  test('the contribution counter matches the displayed installs figure', () => {
    for (const locale of LOCALES) {
      const row = home[locale].products.contribution
      const digits = Number(row.meta.replaceAll(/\D/g, ''))
      expect(row.metaTotal).toBe(digits)
      expect(row.metaSuffix).toStartWith('+')
    }
  })

  test('the wordmark parts spell the wordmark in both languages', () => {
    for (const locale of LOCALES) {
      expect(chrome[locale].wordmarkParts.join('')).toBe(
        chrome[locale].wordmark,
      )
    }
  })
})

describe('home markup', () => {
  const bento = readFileSync(
    path.join(SOURCE_ROOT, 'components', 'HomeBento.astro'),
    'utf8',
  )

  test('it names the slots later tickets fill', () => {
    for (const slot of ['live-strip', 'find-me', 'stack-scene']) {
      expect(bento).toContain(`data-slot="${slot}"`)
    }
  })

  test('the products section carries the anchor id', () => {
    expect(bento).toContain('id="products"')
  })

  test('it adds no inline script', () => {
    expect(bento).not.toContain('is:inline')
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
