import { describe, expect, test } from 'bun:test'

import { stopAfterKey, stopFromRatio, THEME_STOPS } from './theme-stops'

describe('theme stops', () => {
  test('are ordered Light, Auto, Dark', () => {
    expect(THEME_STOPS).toEqual(['light', 'auto', 'dark'])
  })

  test('arrow keys step and clamp at the ends', () => {
    expect(stopAfterKey(0, 'ArrowDown')).toBe(1)
    expect(stopAfterKey(1, 'ArrowRight')).toBe(2)
    expect(stopAfterKey(2, 'ArrowDown')).toBe(2)
    expect(stopAfterKey(1, 'ArrowUp')).toBe(0)
    expect(stopAfterKey(0, 'ArrowLeft')).toBe(0)
  })

  test('Home and End jump, other keys do nothing', () => {
    expect(stopAfterKey(1, 'Home')).toBe(0)
    expect(stopAfterKey(1, 'End')).toBe(2)
    expect(stopAfterKey(1, 'a')).toBeNull()
  })

  test('a press maps to the third it lands in', () => {
    expect(stopFromRatio(-0.2)).toBe(0)
    expect(stopFromRatio(0.4)).toBe(1)
    expect(stopFromRatio(0.9)).toBe(2)
    expect(stopFromRatio(1.4)).toBe(2)
  })
})
