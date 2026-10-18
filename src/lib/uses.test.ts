import { describe, expect, test } from 'bun:test'

import {
  FIELD_ICONS,
  floatClass,
  hasAffiliateRows,
  type UsesCategory,
} from './uses'

const category = (affiliate: boolean): UsesCategory => ({
  name: 'Gear',
  rows: [{ label: 'Mic', value: 'Sample', sample: true, affiliate }],
})

describe('FIELD_ICONS', () => {
  test('holds 8 to 12 icons with unique ids and placements', () => {
    expect(FIELD_ICONS.length).toBeGreaterThanOrEqual(8)
    expect(FIELD_ICONS.length).toBeLessThanOrEqual(12)
    expect(new Set(FIELD_ICONS.map((icon) => icon.id)).size).toBe(
      FIELD_ICONS.length,
    )
    expect(new Set(FIELD_ICONS.map((icon) => icon.placement)).size).toBe(
      FIELD_ICONS.length,
    )
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

describe('hasAffiliateRows', () => {
  test('is true when any row is an affiliate link', () => {
    expect(hasAffiliateRows([category(false), category(true)])).toBe(true)
  })

  test('is false when no row is an affiliate link', () => {
    expect(hasAffiliateRows([category(false)])).toBe(false)
    expect(hasAffiliateRows([])).toBe(false)
  })
})
