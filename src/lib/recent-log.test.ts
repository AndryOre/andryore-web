import { describe, expect, test } from 'bun:test'

import { logEntryFromModule, recentLogEntries } from './recent-log'

const entry = (overrides: Record<string, unknown> = {}) => ({
  lang: 'en',
  key: 'first-solder',
  title: 'Trying a soldering station',
  date: '2026-10-12',
  readTime: '3 min',
  ...overrides,
})

describe('recentLogEntries', () => {
  test('returns the three newest entries of the language, newest first', () => {
    const raw = [
      entry({ key: 'a', date: '2026-10-01' }),
      entry({ key: 'b', date: '2026-10-09' }),
      entry({ key: 'c', date: '2026-10-12' }),
      entry({ key: 'd', date: '2026-10-05' }),
      entry({ key: 'e', date: '2026-10-20', lang: 'es' }),
    ]
    expect(recentLogEntries(raw, 'en').map((item) => item.key)).toEqual([
      'c',
      'b',
      'd',
    ])
  })

  test('returns an empty list when there are no entries', () => {
    expect(recentLogEntries([], 'en')).toEqual([])
  })

  test('skips malformed entries instead of throwing', () => {
    const raw = [
      null,
      'text',
      entry({ title: '' }),
      entry({ date: 'not a date' }),
      entry({ key: undefined }),
      entry({ key: 'ok' }),
    ]
    expect(recentLogEntries(raw, 'en').map((item) => item.key)).toEqual(['ok'])
  })

  test('keeps an entry without a read time', () => {
    const [only] = recentLogEntries([entry({ readTime: undefined })], 'en')
    expect(only?.readTime).toBeUndefined()
  })

  test('honours a custom limit', () => {
    const raw = [entry({ key: 'a' }), entry({ key: 'b' })]
    expect(recentLogEntries(raw, 'en', 1)).toHaveLength(1)
  })
})

describe('logEntryFromModule', () => {
  test('reads the front matter of a Markdown module', () => {
    expect(logEntryFromModule({ frontmatter: entry() })).toEqual(entry())
  })

  test('yields nothing for a module without front matter', () => {
    expect(logEntryFromModule({})).toBeUndefined()
    expect(logEntryFromModule(undefined)).toBeUndefined()
  })
})
