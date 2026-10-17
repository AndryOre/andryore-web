import { absoluteUrl, localePath, type Locale } from '../i18n/locales'

/**
 * Builds the `Person` JSON-LD of the About page. It carries no email and no
 * job title, so the descriptor rule holds and nothing unconfirmed leaks.
 * @param locale The language of the page.
 * @param description The visible intro of the page.
 * @returns A JSON string safe to embed in a JSON-LD script element.
 */
export function personJsonLd(locale: Locale, description: string): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Andry Orellana',
    alternateName: 'AndryOre',
    url: absoluteUrl(localePath(locale, '/about/')),
    description,
    knowsLanguage: ['es', 'en'],
  }
  return JSON.stringify(data).replaceAll('<', String.raw`\u003c`)
}
