import { describe, expect, test } from 'bun:test'

import { DOCK_PAGES } from '../lib/dock'
import chrome from './chrome.json'

describe('chrome content', () => {
  for (const locale of ['en', 'es'] as const) {
    describe(locale, () => {
      test('names every dock page, including Find me', () => {
        for (const page of DOCK_PAGES) {
          expect(chrome[locale].dock.pages[page.key]).toBeTruthy()
        }
      })

      test('has the Sound labels', () => {
        const { sound } = chrome[locale].dock
        expect(sound.label).toBeTruthy()
        expect(sound.on).not.toBe(sound.off)
      })

      test('carries no footer note', () => {
        expect(chrome[locale]).not.toHaveProperty('footerNote')
      })
    })
  }
})
