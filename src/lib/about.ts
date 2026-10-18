import type { Locale } from '../i18n/locales'

/** One figure of the "In numbers" row. */
export interface NumberStat {
  key: 'independent' | 'snug' | 'installs' | 'contributions'
  label: string
  display: string
  /** The value the count-up animates to; absent for a year. */
  count?: number
  suffix?: string
  /** A dated qualifier, such as "As of Oct 18, 2026". */
  note?: string
}

/** The About copy the figures are built from. */
export interface NumbersCopy {
  independentLabel: string
  independentValue: string
  snugLabel: string
  snugUsers: number
  installsLabel: string
  installsAsOf: string
  contributionsLabel: string
}

/** The inputs that come from other data: JSON Flow's row and the GitHub grid. */
export interface NumbersSources {
  installs: { total: number; date: string }
  contributions: number | null
}

const UTC = 'UTC'

/**
 * Formats a timeline date, either a year or a year and month.
 * @param date `YYYY` or `YYYY-MM`.
 * @param locale Language of the month name.
 * @returns "2025" for a year, or a short month and year such as "Aug 2024".
 */
export function formatTimelineDate(date: string, locale: Locale): string {
  if (!/^\d{4}-\d{2}$/.test(date)) return date
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: UTC,
  }).format(new Date(`${date}-01T00:00:00Z`))
}

/**
 * Formats a full ISO date with the year, such as "Oct 18, 2026".
 * @param date ISO date (YYYY-MM-DD).
 * @param locale Language of the format.
 * @returns The formatted date.
 */
function formatFullDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: UTC,
  }).format(new Date(`${date}T00:00:00Z`))
}

/**
 * Builds the figures of the "In numbers" row. The contributions figure is the
 * GitHub grid total, so it is never typed by hand; it is left out when no
 * snapshot is available.
 * @param copy The About copy.
 * @param sources JSON Flow's installs and the GitHub grid total.
 * @param locale Language of the number and date formats.
 * @returns The four figures, in display order.
 */
export function buildNumberStats(
  copy: NumbersCopy,
  sources: NumbersSources,
  locale: Locale,
): NumberStat[] {
  const format = (value: number): string =>
    new Intl.NumberFormat(locale).format(value)
  return [
    {
      key: 'independent',
      label: copy.independentLabel,
      display: copy.independentValue,
    },
    {
      key: 'snug',
      label: copy.snugLabel,
      display: format(copy.snugUsers),
      count: copy.snugUsers,
    },
    {
      key: 'installs',
      label: copy.installsLabel,
      display: format(sources.installs.total),
      count: sources.installs.total,
      suffix: '+',
      note: `${copy.installsAsOf} ${formatFullDate(sources.installs.date, locale)}`,
    },
    ...(sources.contributions === null
      ? []
      : [
          {
            key: 'contributions' as const,
            label: copy.contributionsLabel,
            display: format(sources.contributions),
            count: sources.contributions,
          },
        ]),
  ]
}
