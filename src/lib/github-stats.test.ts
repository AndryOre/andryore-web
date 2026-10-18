import { describe, expect, test } from 'bun:test'

import type { GridSnapshot } from './github-grid'
import {
  computeStats,
  formatDays,
  formatRelative,
  formatShortDate,
  gridCellsHtml,
  isLiveSnapshot,
  loadLiveSnapshot,
  statsView,
  updatedLabel,
} from './github-stats'

const grid = (days: [string, number][]): GridSnapshot => ({
  capturedAt: '2026-01-10',
  total: days.reduce((sum, [, count]) => sum + count, 0),
  weeks: [days.map(([date, count]) => ({ date, count, level: 1 as const }))],
})

describe('computeStats', () => {
  test('is all zero for an empty grid', () => {
    expect(computeStats(grid([]))).toEqual({
      longestStreak: 0,
      currentStreak: 0,
      bestDay: null,
      activeDays: 0,
    })
  })

  test('handles a single active day', () => {
    expect(computeStats(grid([['2026-01-05', 4]]))).toEqual({
      longestStreak: 1,
      currentStreak: 1,
      bestDay: { date: '2026-01-05', count: 4 },
      activeDays: 1,
    })
  })

  test('keeps the earliest day on a tie for best day', () => {
    const stats = computeStats(
      grid([
        ['2026-01-01', 3],
        ['2026-01-02', 3],
        ['2026-01-03', 1],
      ]),
    )
    expect(stats.bestDay).toEqual({ date: '2026-01-01', count: 3 })
    expect(stats.longestStreak).toBe(3)
  })

  test('counts a streak across the year boundary', () => {
    const stats = computeStats(
      grid([
        ['2025-12-30', 1],
        ['2025-12-31', 2],
        ['2026-01-01', 1],
        ['2026-01-02', 0],
        ['2026-01-03', 1],
      ]),
    )
    expect(stats.longestStreak).toBe(3)
    expect(stats.currentStreak).toBe(1)
    expect(stats.activeDays).toBe(4)
  })

  test('keeps the current streak alive when the last day is still empty', () => {
    const stats = computeStats(
      grid([
        ['2026-01-01', 1],
        ['2026-01-02', 1],
        ['2026-01-03', 0],
      ]),
    )
    expect(stats.currentStreak).toBe(2)
  })

  test('breaks the current streak after two empty days', () => {
    const stats = computeStats(
      grid([
        ['2026-01-01', 1],
        ['2026-01-02', 0],
        ['2026-01-03', 0],
      ]),
    )
    expect(stats.currentStreak).toBe(0)
  })

  test('breaks a streak on a missing date', () => {
    const stats = computeStats(
      grid([
        ['2026-01-01', 1],
        ['2026-01-03', 1],
      ]),
    )
    expect(stats.longestStreak).toBe(1)
  })
})

describe('formatting', () => {
  const now = new Date('2026-10-18T12:00:00Z')

  test('formats days with plural rules', () => {
    const units = { one: 'day', other: 'days' }
    expect(formatDays(1, 'en', units)).toBe('1 day')
    expect(formatDays(12, 'en', units)).toBe('12 days')
  })

  test('formats a short UTC date', () => {
    expect(formatShortDate('2026-10-17', 'en')).toBe('Oct 17')
    expect(formatShortDate('2026-10-17', 'es')).toContain('17')
  })

  test('describes minutes, hours and days in English', () => {
    expect(formatRelative('2026-10-18T11:30:00Z', now, 'en')).toBe(
      '30 minutes ago',
    )
    expect(formatRelative('2026-10-18T09:00:00Z', now, 'en')).toBe(
      '3 hours ago',
    )
    expect(formatRelative('2026-10-15T09:00:00Z', now, 'en')).toBe('3 days ago')
  })

  test('describes a bare date in whole days', () => {
    expect(formatRelative('2026-10-17', now, 'en')).toBe('yesterday')
    expect(formatRelative('2026-10-18', now, 'en')).toBe('today')
  })

  test('describes the same moments in Spanish', () => {
    expect(formatRelative('2026-10-18T09:00:00Z', now, 'es')).toBe(
      'hace 3 horas',
    )
    expect(formatRelative('2026-10-15', now, 'es')).toBe('hace 3 días')
  })

  test('puts a space between the prefix and the value', () => {
    expect(updatedLabel('Updated', '2026-10-15', now, 'en')).toBe(
      'Updated 3 days ago',
    )
    expect(updatedLabel('Actualizado', '2026-10-15', now, 'es')).toBe(
      'Actualizado hace 3 días',
    )
  })
})

describe('loadLiveSnapshot', () => {
  const live = {
    capturedAt: '2026-10-18',
    updatedAt: '2026-10-18T10:00:00.000Z',
    total: 1,
    weeks: [[{ date: '2026-10-18', count: 1, level: 1 }]],
  }

  test('returns the payload', async () => {
    expect(
      await loadLiveSnapshot(() => Promise.resolve(Response.json(live))),
    ).toEqual(live as never)
  })

  test('returns null on a 503, a bad body or a network error', async () => {
    expect(
      await loadLiveSnapshot(() =>
        Promise.resolve(new Response('x', { status: 503 })),
      ),
    ).toBeNull()
    expect(
      await loadLiveSnapshot(() => Promise.resolve(Response.json({ a: 1 }))),
    ).toBeNull()
    expect(
      await loadLiveSnapshot(() => Promise.reject(new Error('down'))),
    ).toBeNull()
  })
})

describe('gridCellsHtml and statsView', () => {
  test('renders one cell per day with level and title', () => {
    expect(
      gridCellsHtml([
        [
          { date: '2026-01-01', count: 0, level: 0 },
          { date: '2026-01-02', count: 4, level: 3 },
        ],
      ]),
    ).toBe(
      '<i data-level="0" title="2026-01-01: 0"></i><i data-level="3" title="2026-01-02: 4"></i>',
    )
  })

  test('formats the stats for display', () => {
    const view = statsView(
      computeStats(
        grid([
          ['2026-01-01', 1],
          ['2026-01-02', 7],
        ]),
      ),
      'es',
      { one: 'día', other: 'días' },
    )
    expect(view.longest).toBe('2 días')
    expect(view.best).toBe('7')
    expect(view.active).toBe('2 días')
  })

  test('rejects payloads with unsafe dates', () => {
    expect(
      isLiveSnapshot({
        capturedAt: 'x',
        updatedAt: 'y',
        total: 1,
        weeks: [[{ date: '"><script>', count: 1, level: 1 }]],
      }),
    ).toBe(false)
  })
})
