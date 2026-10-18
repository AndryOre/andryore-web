import { describe, expect, test } from 'bun:test'

import { LOCALES } from '../i18n/locales'
import { ICONS } from '../lib/icons'
import findMe from './find-me.json'

describe('find me content', () => {
  for (const locale of LOCALES) {
    const copy = findMe[locale]

    test(`${locale} lists eight profiles`, () => {
      expect(copy.items).toHaveLength(8)
    })

    test(`${locale} links are https, unique and use known icons`, () => {
      for (const item of copy.items) {
        expect(item.href).toStartWith('https://')
        expect(Object.keys(ICONS)).toContain(item.icon)
        expect(item.glow).toMatch(/^#[0-9a-f]{6}$/)
      }
      const hrefs = copy.items.map((item) => item.href)
      expect(new Set(hrefs).size).toBe(hrefs.length)
    })

    test(`${locale} has every label filled`, () => {
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === 'string') {
          expect(value.length, key).toBeGreaterThan(0)
        }
      }
    })
  }

  test('both languages list the same profiles in the same order', () => {
    const shape = (locale: (typeof LOCALES)[number]) =>
      findMe[locale].items.map(({ icon, href, glow }) => ({ icon, href, glow }))
    expect(shape('es')).toEqual(shape('en'))
    expect(Object.keys(findMe.es)).toEqual(Object.keys(findMe.en))
  })
})
