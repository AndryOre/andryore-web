import { describe, expect, test } from 'bun:test'

import stackScene from '../content/stack-scene.json'
import uses from '../content/uses.json'
import { LOCALES } from '../i18n/locales'
import { ICONS } from './icons'
import {
  END_CARD_TILES,
  GLOW_CLASSES,
  glowHex,
  NOT_FOUND_TILES,
  sizeClass,
  STACK_TILES,
  stackToolCount,
} from './stack-scene'

const usesIcons = (locale: 'en' | 'es'): Set<string> =>
  new Set([
    ...uses[locale].tools.map((badge) => badge.icon),
    ...uses[locale].tech.map((badge) => badge.icon),
  ])

describe('STACK_TILES', () => {
  test('holds 24 unique tiles, 12 of them on mobile', () => {
    expect(STACK_TILES).toHaveLength(24)
    expect(new Set(STACK_TILES.map((tile) => tile.id)).size).toBe(24)
    expect(STACK_TILES.filter((tile) => tile.mobile)).toHaveLength(12)
  })

  test('every tile is a tool or tech of the Uses data, never Astro', () => {
    for (const locale of LOCALES) {
      for (const tile of STACK_TILES) {
        expect(usesIcons(locale).has(tile.id)).toBe(true)
        expect(tile.id).not.toBe('astro')
      }
    }
  })

  test('uses the three sizes and a placement per tile', () => {
    expect(new Set(STACK_TILES.map((tile) => tile.size))).toEqual(
      new Set([96, 72, 56]),
    )
    expect(new Set(STACK_TILES.map((tile) => tile.placement)).size).toBe(24)
  })
})

describe('NOT_FOUND_TILES', () => {
  test('spreads 12 unique tiles, each tipped at its own angle', () => {
    expect(NOT_FOUND_TILES).toHaveLength(12)
    expect(new Set(NOT_FOUND_TILES.map((tile) => tile.id)).size).toBe(12)
    expect(new Set(NOT_FOUND_TILES.map((tile) => tile.placement)).size).toBe(12)
  })
})

describe('stackToolCount', () => {
  test('matches the tools and tech listed on the Uses page', () => {
    for (const locale of LOCALES) {
      expect(stackToolCount(locale)).toBe(
        uses[locale].tools.length + uses[locale].tech.length,
      )
    }
    expect(stackToolCount('en')).toBe(40)
  })

  test('is what the copy shows through its count placeholder', () => {
    for (const locale of LOCALES) {
      expect(stackScene[locale].count).toContain('{count}')
    }
  })
})

describe('glow', () => {
  test('every scene icon exists and has a glow class', () => {
    const ids = [...STACK_TILES, ...NOT_FOUND_TILES, ...END_CARD_TILES].map(
      (tile) => tile.id,
    )
    for (const id of ids) {
      expect(Object.hasOwn(ICONS, id)).toBe(true)
      expect(Object.hasOwn(GLOW_CLASSES, id)).toBe(true)
    }
  })

  test('black and white logos glow neutral, the rest in their brand hex', () => {
    for (const id of ['nextjs', 'shadcn-ui', 'resend', 'tailscale'] as const)
      expect(glowHex(id)).toBe('#8b93a7')
    expect(glowHex('typescript')).toBe('#3178c6')
  })
})

describe('END_CARD_TILES', () => {
  test('lists the five tiles in order with the five tilts', () => {
    expect(END_CARD_TILES.map((tile) => tile.id)).toEqual([
      'typescript',
      'astro',
      'react',
      'bun',
      'shadcn-ui',
    ])
    expect(END_CARD_TILES.map((tile) => tile.tilt)).toEqual([
      '-rotate-[7deg]',
      'rotate-[4deg]',
      '-rotate-[3deg]',
      'rotate-[6deg]',
      '-rotate-[5deg]',
    ])
  })
})

describe('sizeClass', () => {
  test('maps each size to a literal custom property class', () => {
    expect(sizeClass(96)).toBe('[--s:96]')
    expect(sizeClass(72)).toBe('[--s:72]')
    expect(sizeClass(56)).toBe('[--s:56]')
  })
})
