import { describe, expect, test } from 'bun:test'

import {
  countDeviations,
  failedMeasurements,
  findMissingTexts,
  formatReport,
  isWithinTolerance,
  normalizeText,
  parsePixels,
  resolveCanvasPath,
} from './fidelity-audit-core'

describe('normalizeText', () => {
  test('collapses whitespace and curly quotes', () => {
    expect(normalizeText('  Andry’s \n  site\u{A0} ')).toBe("Andry's site")
  })
})

describe('findMissingTexts', () => {
  test('reports canvas strings absent from the rendered text', () => {
    const missing = findMissingTexts(
      'home',
      ['Hello', 'Gone', 'Gone', ' '],
      ['Hello world'],
      [],
    )
    expect(missing).toEqual([{ scene: 'home', text: 'Gone' }])
  })

  test('ignores case and text split across nodes', () => {
    const missing = findMissingTexts(
      'home',
      ['COMING SOON', '75,000+ installs'],
      ['Coming soon', '75,000', '+ installs'],
      [],
    )
    expect(missing).toEqual([])
  })

  test('skips documented exceptions', () => {
    const missing = findMissingTexts(
      'home',
      ['Disponible'],
      [],
      [/^Disponible$/],
    )
    expect(missing).toEqual([])
  })
})

describe('measurements', () => {
  test('parses pixel lengths only', () => {
    expect(parsePixels('20px')).toBe(20)
    expect(parsePixels('1.5px')).toBe(1.5)
    expect(parsePixels('auto')).toBeUndefined()
  })

  test('applies the tolerance and treats a missing value as a failure', () => {
    expect(isWithinTolerance(20.4, 20, 0.5)).toBe(true)
    expect(isWithinTolerance(21, 20, 0.5)).toBe(false)
    expect(isWithinTolerance(undefined, 20, 0.5)).toBe(false)
  })

  test('keeps only the failing results', () => {
    const results = [
      { id: 'a', scene: 's', expected: 20, actual: 20 },
      { id: 'b', scene: 's', expected: 8, actual: 4 },
    ]
    expect(failedMeasurements(results, 0.5).map((r) => r.id)).toEqual(['b'])
  })
})

describe('report', () => {
  const sections = [
    { title: 'Text', lines: ['a', 'b'] },
    { title: 'Overflow', lines: [] },
  ]

  test('counts every line', () => {
    expect(countDeviations(sections)).toBe(2)
  })

  test('renders sections, empty markers and the total', () => {
    const report = formatReport(sections)
    expect(report).toContain('## Text (2)')
    expect(report).toContain('## Overflow (0)\n\n- none')
    expect(report).toContain('Total deviations: 2')
  })
})

describe('resolveCanvasPath', () => {
  test('prefers the argument over the environment', () => {
    expect(resolveCanvasPath(['--x', 'a.html'], { FIDELITY_CANVAS: 'b' })).toBe(
      'a.html',
    )
    expect(resolveCanvasPath([], { FIDELITY_CANVAS: 'b' })).toBe('b')
    expect(resolveCanvasPath([], {})).toBeUndefined()
  })
})
