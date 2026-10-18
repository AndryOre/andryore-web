import { describe, expect, test } from 'bun:test'

import about from '../content/about.json'
import githubGrid from '../content/github-grid.json'
import home from '../content/home.json'
import { buildNumberStats, formatTimelineDate } from './about'

describe('formatTimelineDate', () => {
  test('keeps a bare year and names the month otherwise', () => {
    expect(formatTimelineDate('2025', 'en')).toBe('2025')
    expect(formatTimelineDate('2024-08', 'en')).toBe('Aug 2024')
    expect(formatTimelineDate('2024-08', 'es')).toMatch(/ago.*2024/i)
  })
})

describe('buildNumberStats', () => {
  const sources = {
    installs: { total: 75_000, date: '2026-10-18' },
    contributions: 1234,
  }

  test('takes contributions from the supplied GitHub total, not a literal', () => {
    const stats = buildNumberStats(about.en, sources, 'en')
    const contributions = stats.find((stat) => stat.key === 'contributions')
    expect(contributions?.count).toBe(1234)
    expect(contributions?.display).toBe('1,234')
    const other = buildNumberStats(
      about.en,
      { ...sources, contributions: githubGrid.total },
      'en',
    ).find((stat) => stat.key === 'contributions')
    expect(other?.count).toBe(githubGrid.total)
  })

  test('leaves the contributions figure out without a snapshot', () => {
    const keys = buildNumberStats(
      about.en,
      { ...sources, contributions: null },
      'en',
    ).map((stat) => stat.key)
    expect(keys).toEqual(['independent', 'snug', 'installs'])
  })

  test('keeps the GitHub total out of the copy', () => {
    expect(JSON.stringify(about)).not.toContain(String(githubGrid.total))
  })

  test('dates the installs figure with its day', () => {
    const installs = buildNumberStats(about.en, sources, 'en').find(
      (stat) => stat.key === 'installs',
    )
    expect(installs?.suffix).toBe('+')
    expect(installs?.note).toBe('As of Oct 18, 2026')
  })

  test('uses the same installs total as the Home contribution row', () => {
    expect(home.en.products.contribution.metaTotal).toBe(75_000)
  })
})
