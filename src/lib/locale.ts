/** Site languages: English at `/`, Spanish at `/es/`. */
export const LOCALES = ['en', 'es'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * Home path of a locale, with the trailing slash the site enforces.
 * @param locale The language to link to.
 * @returns `/` for English, `/es/` for Spanish.
 */
export function homePath(locale: Locale): string {
  return locale === 'en' ? '/' : `/${locale}/`
}
