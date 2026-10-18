import { describe, expect, test } from 'bun:test'

import {
  stopAfterKey,
  stopFromRatio,
  stopLevel,
  stopStrength,
  THEME_STOPS,
} from './theme-stops'

describe('theme stop levels', () => {
  test('map each stop to the brightness percentage of the canvas', () => {
    expect(stopLevel('dark')).toBe(24)
    expect(stopLevel('auto')).toBe(62)
    expect(stopLevel('light')).toBe(100)
  })

  test('the strength is a 0 to 1 fraction that drives the sun', () => {
    expect(stopStrength('light')).toBe(1)
    expect(stopStrength('auto')).toBe(0.62)
    expect(stopStrength('dark')).toBe(0.24)
  })
})

describe('theme stops', () => {
  test('are ordered Light, Auto, Dark', () => {
    expect(THEME_STOPS).toEqual(['light', 'auto', 'dark'])
  })

  test('arrow keys step and clamp at the ends', () => {
    expect(stopAfterKey(0, 'ArrowDown')).toBe(1)
    expect(stopAfterKey(1, 'ArrowLeft')).toBe(2)
    expect(stopAfterKey(2, 'ArrowDown')).toBe(2)
    expect(stopAfterKey(1, 'ArrowUp')).toBe(0)
    expect(stopAfterKey(1, 'ArrowRight')).toBe(0)
    expect(stopAfterKey(0, 'ArrowRight')).toBe(0)
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
