import { z } from 'astro/zod'

import { localePath, type Locale } from '../i18n/locales'

/** Lifecycle states a product pill can show. */
const PRODUCT_STATES = ['live', 'beta'] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const isRealDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  )
}

const proofRowSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  date: z.string().refine(isRealDate, 'Proof needs a real YYYY-MM-DD date'),
})

export type ProofRow = z.infer<typeof proofRowSchema>

/**
 * Schema of one product file. A proof row cannot exist without its date, so a
 * number never ships undated. `draft` and `image.placeholder` flag content
 * that still needs the owner's approval (ADR 0007).
 * @param imageSource The field type of `image.src`: Astro's `image()` helper
 *   in the collection, a plain string in tests.
 * @returns The Zod object schema.
 */
export function createProductSchema<Source extends z.ZodType>(
  imageSource: Source,
) {
  return z.object({
    key: z.string().min(1),
    lang: z.enum(['en', 'es']),
    name: z.string().min(1),
    value: z.string().min(1),
    description: z.string().min(1).max(160),
    state: z.enum(PRODUCT_STATES),
    url: z.url(),
    changelog: z.url(),
    stack: z.array(z.string().min(1)).min(1),
    proof: z.array(proofRowSchema).default([]),
    image: z.object({
      src: imageSource,
      alt: z.string().min(1),
      placeholder: z.boolean().default(false),
    }),
    draft: z.boolean().default(false),
  })
}

type ProductData = z.infer<
  ReturnType<typeof createProductSchema<z.ZodType<ImageMetadata>>>
>

/**
 * A product collection entry as pages use it. Typed here because the
 * generated `astro:content` types are not available to lint or `tsc`.
 */
export interface ProductEntry {
  id: string
  data: ProductData
}

/**
 * Proof rows that may be shown: only those with both a value and a date.
 * @param rows The proof rows of a product, if any.
 * @returns The displayable rows; empty when there is no proof.
 */
export function visibleProof(
  rows: readonly ProofRow[] | undefined,
): ProofRow[] {
  return (rows ?? []).filter((row) => row.value !== '' && row.date !== '')
}

/**
 * Formats a proof date in the page language.
 * @param isoDate A `YYYY-MM-DD` date.
 * @param locale The page language.
 * @returns A long date such as `September 1, 2026`, in UTC so it never drifts.
 */
export function formatProofDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`))
}

/**
 * Fills a `{name}` style placeholder of a UI string with literal text.
 * @param template The UI string.
 * @param name The placeholder name, without braces.
 * @param value The text to insert, taken literally.
 * @returns The template with every occurrence replaced.
 */
export function fillPlaceholder(
  template: string,
  name: string,
  value: string,
): string {
  return template.split(`{${name}}`).join(value)
}

/**
 * Product keys that have an English file, read from the file names so callers
 * need no generated content types.
 * @param files Product file paths such as `./snug.en.md`.
 * @returns The sorted shared keys.
 */
export function englishProductKeys(files: readonly string[]): string[] {
  return files
    .flatMap((file) => /([^/]+)\.en\.md$/.exec(file)?.[1] ?? [])
    .toSorted((a, b) => a.localeCompare(b))
}

/**
 * Path of a product page in a language.
 * @param locale The page language.
 * @param key The shared product key.
 * @returns `/products/<key>/`, prefixed with `/es` for Spanish.
 */
export function productPath(locale: Locale, key: string): string {
  return localePath(locale, `/products/${key}/`)
}
