import { absoluteUrl, otherLocale } from '../i18n/locales'
import { logEntryPath, type LogEntrySummary } from './entries'

export interface LogEntryMeta extends LogEntrySummary {
  description: string
}

export interface OpenGraphTag {
  property: string
  content: string
}

const AUTHOR_NAME = 'Andry Orellana'

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Open Graph tags that make an entry unique per language.
 * @param entry The entry's title, description, language, key and date.
 * @returns The `property`/`content` pairs to render in `<head>`.
 */
export function openGraphTags(entry: LogEntryMeta): OpenGraphTag[] {
  return [
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: entry.title },
    { property: 'og:description', content: entry.description },
    {
      property: 'og:url',
      content: absoluteUrl(logEntryPath(entry.lang, entry.key)),
    },
    { property: 'og:locale', content: entry.lang },
    { property: 'og:locale:alternate', content: otherLocale(entry.lang) },
    { property: 'article:published_time', content: isoDay(entry.date) },
  ]
}

/**
 * `Article` structured data for an entry. The output goes inside a
 * non-executable `application/ld+json` block, so the CSP needs no hash.
 * @param entry The entry's title, description, language, key and date.
 * @returns JSON that is safe to place inside a `<script>` element.
 */
export function articleJsonLd(entry: LogEntryMeta): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.description,
    inLanguage: entry.lang,
    datePublished: isoDay(entry.date),
    mainEntityOfPage: absoluteUrl(logEntryPath(entry.lang, entry.key)),
    author: { '@type': 'Person', name: AUTHOR_NAME },
  }).replaceAll('<', String.raw`\u003c`)
}
