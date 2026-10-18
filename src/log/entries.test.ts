import { describe, expect, test } from 'bun:test'

import {
  counterpartOf,
  entriesIn,
  formatLogDate,
  latestEntries,
  logEntryPath,
  logIndexPath,
  neighboursOf,
  readTimeLabel,
  type LogEntrySummary,
} from './entries'

const entry = (
  key: string,
  lang: 'en' | 'es',
  date: string,
): LogEntrySummary => ({ key, lang, date: new Date(date), title: key })

const all = [
  entry('old', 'en', '2026-01-10'),
  entry('mid', 'en', '2026-03-10'),
  entry('new', 'en', '2026-05-10'),
  entry('old', 'es', '2026-01-10'),
  entry('mid', 'es', '2026-03-10'),
  entry('new', 'es', '2026-05-10'),
]

describe('entriesIn', () => {
  test('keeps one language, newest first', () => {
    expect(entriesIn(all, 'es').map((item) => item.key)).toEqual([
      'new',
      'mid',
      'old',
    ])
  })

  test('is empty when the language has no entries', () => {
    expect(entriesIn([], 'en')).toEqual([])
  })
})

describe('latestEntries', () => {
  test('returns the newest entries of a language up to the count', () => {
    expect(latestEntries(all, 'en', 2).map((item) => item.key)).toEqual([
      'new',
      'mid',
    ])
  })
})

describe('neighboursOf', () => {
  test('previous is older and next is newer', () => {
    const sorted = entriesIn(all, 'en')
    const middle = sorted[1]
    if (!middle) throw new Error('missing fixture')
    const { previous, next } = neighboursOf(sorted, middle)
    expect(previous?.key).toBe('old')
    expect(next?.key).toBe('new')
  })

  test('the ends have no neighbour on one side', () => {
    const sorted = entriesIn(all, 'en')
    const [newest, , oldest] = sorted
    if (!newest || !oldest) throw new Error('missing fixture')
    expect(neighboursOf(sorted, newest).next).toBeUndefined()
    expect(neighboursOf(sorted, oldest).previous).toBeUndefined()
  })
})

describe('counterpartOf', () => {
  test('finds the same key in the other language', () => {
    const pair = counterpartOf(all, entry('mid', 'en', '2026-03-10'))
    expect(pair?.lang).toBe('es')
  })

  test('is undefined when there is no pair', () => {
    const none = counterpartOf<LogEntrySummary>(
      [],
      entry('mid', 'en', '2026-03-10'),
    )
    expect(none).toBeUndefined()
  })
})

describe('paths', () => {
  test('English lives at /log/, Spanish at /es/log/', () => {
    expect(logIndexPath('en')).toBe('/log/')
    expect(logIndexPath('es')).toBe('/es/log/')
    expect(logEntryPath('es', 'mid')).toBe('/es/log/mid/')
  })
})

describe('formatLogDate', () => {
  test('writes the date in the language of the page, in UTC', () => {
    const date = new Date('2026-03-01T00:00:00Z')
    expect(formatLogDate(date, 'en')).toBe('Mar 1, 2026')
    expect(formatLogDate(date, 'es')).toBe('1 mar 2026')
  })
})

describe('readTimeLabel', () => {
  test('fills the minutes placeholder', () => {
    expect(readTimeLabel('{minutes} min read', 3)).toBe('3 min read')
  })
})
