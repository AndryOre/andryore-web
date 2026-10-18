import { localePath, otherLocale, type Locale } from '../i18n/locales'

export interface LogEntrySummary {
  key: string
  lang: Locale
  date: Date
  title: string
}

/**
 * Entries of one language, newest first.
 * @param entries Entries of every language.
 * @param lang The language to keep.
 * @returns A new array sorted by date, newest first.
 */
export function entriesIn<Entry extends LogEntrySummary>(
  entries: readonly Entry[],
  lang: Locale,
): Entry[] {
  return entries
    .filter((entry) => entry.lang === lang)
    .toSorted((left, right) => right.date.getTime() - left.date.getTime())
}

/**
 * The newest entries of a language, for the home Recent tile.
 * @param entries Entries of every language.
 * @param lang The language to keep.
 * @param count How many entries to return at most.
 * @returns Up to `count` entries, newest first.
 */
export function latestEntries<Entry extends LogEntrySummary>(
  entries: readonly Entry[],
  lang: Locale,
  count: number,
): Entry[] {
  return entriesIn(entries, lang).slice(0, count)
}

/**
 * The entries that sit next to one in date order.
 * @param sorted Entries of one language, newest first.
 * @param current The entry being shown.
 * @returns The older entry as `previous` and the newer as `next`.
 */
export function neighboursOf<Entry extends LogEntrySummary>(
  sorted: readonly Entry[],
  current: LogEntrySummary,
): { previous: Entry | undefined; next: Entry | undefined } {
  const index = sorted.findIndex((entry) => entry.key === current.key)
  const older = index === -1 ? [] : sorted.slice(index + 1, index + 2)
  const newer = index > 0 ? sorted.slice(index - 1, index) : []
  return { previous: older[0], next: newer[0] }
}

/**
 * The same entry in the other language.
 * @param entries Entries of every language.
 * @param current The entry being shown.
 * @returns The entry with the same key in the other language, if any.
 */
export function counterpartOf<Entry extends LogEntrySummary>(
  entries: readonly Entry[],
  current: LogEntrySummary,
): Entry | undefined {
  const lang = otherLocale(current.lang)
  return entries.find(
    (entry) => entry.lang === lang && entry.key === current.key,
  )
}

/**
 * Path of the Log list.
 * @param lang The language of the page.
 * @returns `/log/` or `/es/log/`.
 */
export function logIndexPath(lang: Locale): string {
  return localePath(lang, '/log/')
}

/**
 * Path of a Log entry; the key is the URL slug in both languages.
 * @param lang The language of the page.
 * @param key The shared key of the entry.
 * @returns `/log/<key>/` or `/es/log/<key>/`.
 */
export function logEntryPath(lang: Locale, key: string): string {
  return localePath(lang, `/log/${key}/`)
}

/**
 * Short date in the language of the page.
 * @param date The entry date; read as UTC so builds agree everywhere.
 * @param lang The language of the page.
 * @returns For example `Mar 1, 2026` or `1 mar 2026`.
 */
export function formatLogDate(date: Date, lang: Locale): string {
  return date
    .toLocaleDateString(lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replaceAll('.', '')
    .replaceAll(' de ', ' ')
}

/**
 * Fills the `{minutes}` placeholder of a read-time label.
 * @param template The label from the Log copy.
 * @param minutes The read time of the entry.
 * @returns The label with the number in place.
 */
export function readTimeLabel(template: string, minutes: number): string {
  return template.split('{minutes}').join(String(minutes))
}
