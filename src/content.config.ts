import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

import { LOCALES } from './i18n/locales'

const log = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/log' }),
  schema: z.object({
    lang: z.enum(LOCALES),
    key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(160),
    date: z.coerce.date(),
    readMinutes: z.number().int().positive(),
    sourceHash: z.string().optional(),
    review: z.string().optional(),
  }),
})

export const collections = { log }
