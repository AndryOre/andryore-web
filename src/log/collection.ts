import { getCollection, render } from 'astro:content'
import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

import type { Locale } from '../i18n/locales'
import { entriesIn, latestEntries } from './entries'

interface LogData {
  lang: Locale
  key: string
  title: string
  description: string
  date: Date
  readMinutes: number
  sourceHash?: string
  review?: string
}

export interface LogEntry extends LogData {
  id: string
  data: LogData
}

/**
 * Every Log entry of both languages, with its frontmatter lifted to the top.
 * The schema in `content.config.ts` has already validated the data.
 * @returns The entries in no particular order.
 */
export async function getLogEntries(): Promise<LogEntry[]> {
  const raw: unknown = await getCollection('log')
  return (raw as { id: string; data: LogData }[]).map((entry) => ({
    ...entry,
    ...entry.data,
  }))
}

/**
 * The newest Log entries of a language, for the home Recent tile.
 * @public
 * @param lang The language of the page.
 * @param count How many entries to return at most.
 * @returns Up to `count` entries, newest first.
 */
export async function getLatestLogEntries(
  lang: Locale,
  count: number,
): Promise<LogEntry[]> {
  return latestEntries(await getLogEntries(), lang, count)
}

/**
 * The entries of one language, newest first.
 * @param lang The language of the page.
 * @returns Every entry of the language.
 */
export async function getLogEntriesIn(lang: Locale): Promise<LogEntry[]> {
  return entriesIn(await getLogEntries(), lang)
}

/**
 * Renders an entry's Markdown body.
 * @param entry An entry from this module.
 * @returns The component that renders the body.
 */
export async function renderLogEntry(
  entry: LogEntry,
): Promise<{ Content: AstroComponentFactory }> {
  const rendered: unknown = await render(entry)
  return rendered as { Content: AstroComponentFactory }
}
