import type { LiveGridSnapshot } from './github-contributions'
import type { GridDay, GridSnapshot } from './github-grid'

/** The same-origin path of the contributions endpoint (ADR 0017). */
const CONTRIBUTIONS_ENDPOINT = '/api/github-contributions'

/** Numbers derived from a snapshot; no data beyond the grid itself. */
export interface GridStats {
  /** Longest run of consecutive days with at least one contribution. */
  longestStreak: number
  /** Run ending on the last day, or the day before it when that day is empty. */
  currentStreak: number
  /** The day with the most contributions (earliest wins a tie), or null. */
  bestDay: { date: string; count: number } | null
  /** Days with at least one contribution. */
  activeDays: number
}

/** The singular and plural word for "day" in one language. */
export interface DayUnits {
  one: string
  other: string
}

const DAY_MS = 86_400_000

const dayNumber = (date: string): number =>
  Date.parse(`${date}T00:00:00Z`) / DAY_MS

/**
 * Flattens a snapshot into days sorted by date.
 * @param snapshot The grid to read.
 * @returns Every day, oldest first.
 */
function sortedDays(snapshot: GridSnapshot): GridDay[] {
  return snapshot.weeks.flat().toSorted((a, b) => a.date.localeCompare(b.date))
}

/**
 * Computes the stats row from a snapshot. Streaks follow calendar dates, so
 * they cross month and year boundaries and break on any missing date.
 * @param snapshot The grid to read.
 * @returns The four stats.
 */
export function computeStats(snapshot: GridSnapshot): GridStats {
  const days = sortedDays(snapshot)
  let longestStreak = 0
  let run = 0
  let previous: number | undefined
  let bestDay: GridStats['bestDay'] = null
  let activeDays = 0
  const runEndingAt = new Map<number, number>()
  for (const day of days) {
    const current = dayNumber(day.date)
    if (day.count > 0) {
      activeDays += 1
      run = previous !== undefined && current - previous === 1 ? run + 1 : 1
      runEndingAt.set(current, run)
      longestStreak = Math.max(longestStreak, run)
      if (!bestDay || day.count > bestDay.count) {
        bestDay = { date: day.date, count: day.count }
      }
    } else {
      run = 0
    }
    previous = current
  }
  const last = days.at(-1)
  let currentStreak = 0
  if (last) {
    const lastNumber = dayNumber(last.date)
    currentStreak =
      runEndingAt.get(lastNumber) ?? runEndingAt.get(lastNumber - 1) ?? 0
  }
  return { longestStreak, currentStreak, bestDay, activeDays }
}

/**
 * Formats "{n} {unit}" for a number of days.
 * @param count The number of days.
 * @param locale Language of the number format and plural rule.
 * @param units The singular and plural words from the content file.
 * @returns For example "12 days".
 */
export function formatDays(
  count: number,
  locale: string,
  units: DayUnits,
): string {
  const word =
    new Intl.PluralRules(locale).select(count) === 'one'
      ? units.one
      : units.other
  return `${new Intl.NumberFormat(locale).format(count)} ${word}`
}

/**
 * Formats an ISO date as a short UTC date, such as "Oct 17".
 * @param date An ISO date (YYYY-MM-DD).
 * @param locale Language of the format.
 * @returns Month and day, without the year.
 */
export function formatShortDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

/**
 * Describes how long ago a moment was, such as "3 hours ago" or "hace 3
 * horas". A bare date (no time) is measured in whole days, since its time of
 * day is unknown.
 * @param since ISO date or ISO timestamp.
 * @param now The current moment.
 * @param locale Language of the phrase.
 * @returns The relative phrase, without a prefix.
 */
export function formatRelative(
  since: string,
  now: Date,
  locale: string,
): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const dateOnly = since.length === 10
  const elapsed = Math.max(0, now.getTime() - Date.parse(since))
  const minutes = Math.floor(elapsed / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(elapsed / DAY_MS)
  if (dateOnly || hours >= 24) return formatter.format(-days, 'day')
  return hours >= 1
    ? formatter.format(-hours, 'hour')
    : formatter.format(-minutes, 'minute')
}

/**
 * Builds the tile label, with a space before the value.
 * @param prefix "Updated" or "Actualizado".
 * @param since ISO date or timestamp of the data.
 * @param now The current moment.
 * @param locale Language of the phrase.
 * @returns For example "Updated 3 hours ago".
 */
export function updatedLabel(
  prefix: string,
  since: string,
  now: Date,
  locale: string,
): string {
  return `${prefix} ${formatRelative(since, now, locale)}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDay = (value: unknown): value is GridDay =>
  isRecord(value) &&
  typeof value.date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
  Number.isSafeInteger(value.count) &&
  typeof value.level === 'number' &&
  [0, 1, 2, 3, 4].includes(value.level)

/**
 * Narrows an unknown JSON body to the endpoint payload.
 * @param value The parsed body.
 * @returns True when it is a usable grid.
 */
export function isLiveSnapshot(value: unknown): value is LiveGridSnapshot {
  return (
    isRecord(value) &&
    typeof value.updatedAt === 'string' &&
    typeof value.capturedAt === 'string' &&
    typeof value.total === 'number' &&
    Array.isArray(value.weeks) &&
    value.weeks.every((week) => Array.isArray(week) && week.every(isDay))
  )
}

type Fetcher = (url: string) => Promise<Response>

/**
 * Asks the same-origin endpoint for the live grid.
 * @param fetcher The `fetch` to use; defaults to the platform one.
 * @returns The grid, or null on any failure so the caller keeps its snapshot.
 */
export async function loadLiveSnapshot(
  fetcher: Fetcher = (url) =>
    fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(4000) }),
): Promise<LiveGridSnapshot | null> {
  try {
    const response = await fetcher(CONTRIBUTIONS_ENDPOINT)
    if (!response.ok) return null
    const body: unknown = await response.json()
    return isLiveSnapshot(body) ? body : null
  } catch {
    return null
  }
}

const escapeAttribute = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

/** Tooltip templates with `{count}` and `{date}` placeholders. */
export interface TipTemplates {
  one: string
  other: string
  none: string
}

/**
 * Builds the per-day tooltip, such as "3 contributions on Oct 12, 2026".
 * @param day The date (YYYY-MM-DD) and contribution count.
 * @param day.date The ISO date of the day.
 * @param day.count The contributions on that day.
 * @param locale Language of the date and the plural rule.
 * @param templates The sentence for one, many and no contributions.
 * @returns The tooltip text.
 */
export function formatContributionTip(
  day: { date: string; count: number },
  locale: string,
  templates: TipTemplates,
): string {
  const date = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day.date}T00:00:00Z`))
  let template = templates.other
  if (day.count === 0) template = templates.none
  else if (new Intl.PluralRules(locale).select(day.count) === 'one') {
    template = templates.one
  }
  return template
    .replace('{count}', () => new Intl.NumberFormat(locale).format(day.count))
    .replace('{date}', () => date)
}

/** A month name placed at a 1-based week column of the grid. */
export interface MonthLabel {
  label: string
  column: number
}

const MIN_MONTH_SPAN_WEEKS = 3

/**
 * Finds where each month starts along the weeks of the grid. A first label
 * that the next month would overlap is dropped.
 * @param weeks The weeks of the grid, oldest first.
 * @param locale Language of the month names.
 * @returns One label per month, with its week column.
 */
export function monthLabels(weeks: GridDay[][], locale: string): MonthLabel[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone: 'UTC',
  })
  const labels: MonthLabel[] = []
  let previousMonth = ''
  for (const [index, week] of weeks.entries()) {
    const first = week[0]
    if (!first) continue
    const month = first.date.slice(0, 7)
    if (month === previousMonth) continue
    previousMonth = month
    labels.push({
      label: formatter.format(new Date(`${first.date}T00:00:00Z`)),
      column: index + 1,
    })
  }
  const [head, following] = labels
  if (
    head &&
    following &&
    following.column - head.column < MIN_MONTH_SPAN_WEEKS
  ) {
    labels.shift()
  }
  return labels
}

/**
 * Renders the grid cells as markup shared by the build and the live refresh.
 * Only dates, counts and levels are interpolated, and `isLiveSnapshot`
 * rejects any other shape before a live grid reaches this function.
 * @param weeks The weeks of the grid, oldest first.
 * @param tip Builds the tooltip text of a day.
 * @returns One `<i>` per day, in column-major order.
 */
export function gridCellsHtml(
  weeks: GridDay[][],
  tip: (day: GridDay) => string,
): string {
  return weeks
    .flat()
    .map(
      (day) =>
        `<i data-level="${String(day.level)}" data-tip="${escapeAttribute(tip(day))}"></i>`,
    )
    .join('')
}

/** Display strings of the stats row. */
export interface StatsView {
  longest: string
  current: string
  best: string
  bestDate: string
  active: string
}

/**
 * Formats the stats for display.
 * @param stats The computed stats.
 * @param locale Language of numbers, dates and plurals.
 * @param units Day unit words from the content file.
 * @returns Display strings; the best day is "0" with an empty date when none.
 */
export function statsView(
  stats: GridStats,
  locale: string,
  units: DayUnits,
): StatsView {
  return {
    longest: formatDays(stats.longestStreak, locale, units),
    current: formatDays(stats.currentStreak, locale, units),
    best: new Intl.NumberFormat(locale).format(stats.bestDay?.count ?? 0),
    bestDate: stats.bestDay ? formatShortDate(stats.bestDay.date, locale) : '',
    active: formatDays(stats.activeDays, locale, units),
  }
}
