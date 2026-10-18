import type { StreamStatus } from './twitch-status'

/** The four things the stream tile can show. */
export type StreamView = 'coming-soon' | 'scheduled' | 'live' | 'unavailable'

/** UTC weekdays of the planned sessions: Tuesday and Thursday. */
export const SESSION_WEEKDAYS: readonly number[] = [2, 4]

/** UTC hour at which every planned session starts. */
const SESSION_HOUR_UTC = 19

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/**
 * Picks the view from the endpoint answer and the content flag. A live
 * channel always shows live; before streams have started, anything else is
 * the coming-soon slate.
 * @param status The answer of the status endpoint.
 * @param streamsStarted The content flag set once streams are running.
 * @returns The view to show.
 */
export function selectStreamView(
  status: StreamStatus,
  streamsStarted: boolean,
): StreamView {
  if (status.state === 'live') return 'live'
  if (!streamsStarted) return 'coming-soon'
  return status.state === 'offline' ? 'scheduled' : 'unavailable'
}

/**
 * Finds the next planned session start strictly after a moment.
 * @param now The current moment.
 * @returns The start of the next Tuesday or Thursday session, in UTC.
 */
export function nextSession(now: Date): Date {
  for (let offset = 0; offset <= 7; offset += 1) {
    const day = new Date(now.getTime() + offset * DAY_MS)
    if (!SESSION_WEEKDAYS.includes(day.getUTCDay())) continue
    const start = Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      SESSION_HOUR_UTC,
    )
    if (start > now.getTime()) return new Date(start)
  }
  throw new Error('No session found within a week')
}

/**
 * Formats a session start as short weekday and UTC time, such as
 * "Tue 19:00 UTC".
 * @param start Moment the session begins.
 * @param locale Language of the weekday.
 * @returns The label.
 */
export function formatSession(start: Date, locale: string): string {
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(start)
  const hour = String(start.getUTCHours()).padStart(2, '0')
  const minute = String(start.getUTCMinutes()).padStart(2, '0')
  return `${weekday} ${hour}:${minute} UTC`
}

/**
 * Describes the time left until a start, such as "in 2 days".
 * @param start The future moment.
 * @param now The current moment.
 * @param locale Language of the phrase.
 * @returns The countdown phrase.
 */
export function formatCountdown(
  start: Date,
  now: Date,
  locale: string,
): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const remaining = Math.max(0, start.getTime() - now.getTime())
  if (remaining >= DAY_MS) {
    return formatter.format(Math.floor(remaining / DAY_MS), 'day')
  }
  return remaining >= HOUR_MS
    ? formatter.format(Math.floor(remaining / HOUR_MS), 'hour')
    : formatter.format(Math.ceil(remaining / MINUTE_MS), 'minute')
}
