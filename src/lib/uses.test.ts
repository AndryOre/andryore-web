import { describe, expect, test } from 'bun:test'

import { ICONS, type IconId } from './icons'
import {
  BADGE_COLORS,
  badgeIconId,
  badgeStyle,
  contrastRatio,
  FIELD_ICONS,
  floatClass,
  SETUP_GLYPHS,
  SWATCH_TOKENS,
} from './uses'

describe('FIELD_ICONS', () => {
  test('holds 8 to 12 brand icons with unique ids and placements', () => {
    expect(FIELD_ICONS.length).toBeGreaterThanOrEqual(8)
    expect(FIELD_ICONS.length).toBeLessThanOrEqual(12)
    expect(new Set(FIELD_ICONS.map((icon) => icon.id)).size).toBe(
      FIELD_ICONS.length,
    )
    expect(new Set(FIELD_ICONS.map((icon) => icon.placement)).size).toBe(
      FIELD_ICONS.length,
    )
    for (const icon of FIELD_ICONS)
      expect(Object.hasOwn(ICONS, icon.id)).toBe(true)
  })
})

describe('floatClass', () => {
  test('cycles through floats that last 6 to 8 seconds', () => {
    expect(floatClass(0)).toBe('uses-float-6')
    expect(floatClass(1)).toBe('uses-float-7')
    expect(floatClass(2)).toBe('uses-float-8')
    expect(floatClass(3)).toBe('uses-float-6')
  })

  test('treats a negative index as the first float', () => {
    expect(floatClass(-4)).toBe('uses-float-6')
  })
})

describe('contrastRatio', () => {
  test('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('badgeStyle', () => {
  test('uses a white logo and name on a dark brand', () => {
    const style = badgeStyle('coolify')
    expect(style.text).toBe('text-white')
    expect(style.logo).toContain('invert')
  })

  test('uses dark text on a light brand', () => {
    const style = badgeStyle('bun')
    expect(style.text).not.toBe('text-white')
    expect(style.logo).not.toContain('invert')
  })

  test('every badge reaches 4.5:1 and its class names its hex', () => {
    for (const id of Object.keys(BADGE_COLORS) as IconId[]) {
      const style = badgeStyle(id)
      expect(style.bg).toBe(`bg-[${style.hex}]`)
      expect(style.ratio).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('rejects an icon without a badge colour', () => {
    expect(() => badgeStyle('twitch')).toThrow()
  })
})

describe('badgeIconId', () => {
  test('returns a known id and throws on an unknown one', () => {
    expect(badgeIconId('bun')).toBe('bun')
    expect(() => badgeIconId('nope')).toThrow()
  })
})

describe('tables', () => {
  test('holds six colour swatches and the seven setup glyphs', () => {
    expect(SWATCH_TOKENS).toHaveLength(6)
    expect(SETUP_GLYPHS).toEqual([
      'laptop',
      'mic',
      'camera',
      'mouse',
      'keyboard',
      'usb',
      'headphones',
    ])
  })
})
