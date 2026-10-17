import type { Locale } from '../i18n/locales'

export interface RecentLogEntry {
  lang: Locale
  key: string
  title: string
  date: string
  readTime?: string
}

/** How many Log entries the home page's Recent tile shows. */
const RECENT_LOG_LIMIT = 3

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

function toIsoDate(value: unknown): string | undefined {
  const date =
    value instanceof Date
      ? value
      : nonEmpty(value)
        ? new Date(value)
        : undefined
  return date !== undefined && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : undefined
}

function parseEntry(raw: unknown): RecentLogEntry | undefined {
  if (!isRecord(raw)) return undefined
  const { lang, key, title, readTime, date: rawDate } = raw
  const date = toIsoDate(rawDate)
  if (
    date === undefined ||
    (lang !== 'en' && lang !== 'es') ||
    !nonEmpty(key) ||
    !nonEmpty(title)
  ) {
    return undefined
  }
  return {
    lang,
    key,
    title,
    date,
    ...(nonEmpty(readTime) && { readTime }),
  }
}

/**
 * Picks the newest Log entries of one language. Reads defensively: anything
 * that is not a complete entry is skipped, so a missing or half-written Log
 * collection yields the empty state instead of a failed build.
 * @param raw Front matter of every Log entry, in any order and shape.
 * @param locale The language the page is shown in.
 * @param limit Maximum number of entries to return.
 * @returns The newest entries first.
 */
export function recentLogEntries(
  raw: readonly unknown[],
  locale: Locale,
  limit = RECENT_LOG_LIMIT,
): RecentLogEntry[] {
  return raw
    .flatMap((item) => parseEntry(item) ?? [])
    .filter((item) => item.lang === locale)
    .toSorted((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit)
}

/**
 * Reads the front matter off a Markdown module, as `import.meta.glob` loads it.
 * @param module The loaded module, or anything else.
 * @returns The front matter, or nothing when the module has none.
 */
export function logEntryFromModule(module: unknown): unknown {
  if (!isRecord(module)) return undefined
  const { frontmatter } = module
  return frontmatter
}
