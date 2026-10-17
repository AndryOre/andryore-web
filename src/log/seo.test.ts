import { describe, expect, test } from 'bun:test'

import { articleJsonLd, openGraphTags } from './seo'

const entry = {
  key: 'hello',
  lang: 'es' as const,
  title: 'Hola',
  description: 'Una nota',
  date: new Date('2026-03-01T00:00:00Z'),
}

describe('openGraphTags', () => {
  test('describes the entry as an article in its own language', () => {
    expect(openGraphTags(entry)).toEqual([
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: 'Hola' },
      { property: 'og:description', content: 'Una nota' },
      { property: 'og:url', content: 'https://andryore.dev/es/log/hello/' },
      { property: 'og:locale', content: 'es' },
      { property: 'og:locale:alternate', content: 'en' },
      { property: 'article:published_time', content: '2026-03-01' },
    ])
  })
})

describe('articleJsonLd', () => {
  test('is an Article with the page language, date and author', () => {
    const parsed: unknown = JSON.parse(articleJsonLd(entry))
    expect(parsed).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Hola',
      description: 'Una nota',
      inLanguage: 'es',
      datePublished: '2026-03-01',
      mainEntityOfPage: 'https://andryore.dev/es/log/hello/',
      author: { '@type': 'Person', name: 'Andry Orellana' },
    })
  })

  test('cannot close the script element it is embedded in', () => {
    const json = articleJsonLd({ ...entry, title: '</script><b>' })
    expect(json).not.toContain('</script>')
  })
})
