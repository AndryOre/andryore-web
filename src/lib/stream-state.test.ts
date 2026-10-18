import { describe, expect, test } from 'bun:test'

import {
  formatCountdown,
  formatSession,
  nextSession,
  selectStreamView,
} from './stream-state'

describe('selectStreamView', () => {
  test('live wins regardless of the flag', () => {
    const live = { state: 'live', title: 'x' } as const
    expect(selectStreamView(live, false)).toBe('live')
    expect(selectStreamView(live, true)).toBe('live')
  })

  test('before streams start, offline and unavailable are coming soon', () => {
    expect(selectStreamView({ state: 'offline' }, false)).toBe('coming-soon')
    expect(selectStreamView({ state: 'unavailable' }, false)).toBe(
      'coming-soon',
    )
  })

  test('after streams start, offline is scheduled', () => {
    expect(selectStreamView({ state: 'offline' }, true)).toBe('scheduled')
    expect(selectStreamView({ state: 'unavailable' }, true)).toBe('unavailable')
  })
})

describe('nextSession', () => {
  test('before 19:00 on a Tuesday it is that same day', () => {
    const next = nextSession(new Date('2026-10-20T10:00:00Z'))
    expect(next.toISOString()).toBe('2026-10-20T19:00:00.000Z')
  })

  test('after Tuesday 19:00 it is Thursday', () => {
    const next = nextSession(new Date('2026-10-20T19:00:00Z'))
    expect(next.toISOString()).toBe('2026-10-22T19:00:00.000Z')
  })

  test('after Thursday it is next Tuesday, across a month end', () => {
    const next = nextSession(new Date('2026-10-29T20:00:00Z'))
    expect(next.toISOString()).toBe('2026-11-03T19:00:00.000Z')
  })
})

describe('formatting', () => {
  const start = new Date('2026-10-20T19:00:00Z')

  test('formats the session in each language', () => {
    expect(formatSession(start, 'en')).toBe('Tue 19:00 UTC')
    expect(formatSession(start, 'es')).toMatch(/^mar.? 19:00 UTC$/)
  })

  test('counts down in days, hours and minutes', () => {
    expect(formatCountdown(start, new Date('2026-10-18T19:00:00Z'), 'en')).toBe(
      'in 2 days',
    )
    expect(formatCountdown(start, new Date('2026-10-18T20:00:00Z'), 'en')).toBe(
      'in 2 days',
    )
    expect(formatCountdown(start, new Date('2026-10-19T18:00:00Z'), 'en')).toBe(
      'tomorrow',
    )
    expect(formatCountdown(start, new Date('2026-10-20T16:30:00Z'), 'en')).toBe(
      'in 2 hours',
    )
    expect(formatCountdown(start, new Date('2026-10-20T18:30:00Z'), 'en')).toBe(
      'in 30 minutes',
    )
  })
})
