import { describe, expect, test } from 'bun:test'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { z } from 'astro/zod'

import { runParityCheck } from '../i18n/parity-check'
import {
  createProductSchema,
  englishProductKeys,
  fillPlaceholder,
  formatProofDate,
  productPath,
  visibleProof,
} from './products'

const schema = createProductSchema(z.string())
const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..', '..')
const PRODUCTS_DIRECTORY = path.join(
  REPOSITORY_ROOT,
  'src',
  'content',
  'products',
)

const valid = {
  key: 'snug',
  lang: 'en',
  name: 'Snug',
  value: 'A value line.',
  description: 'Meta description.',
  state: 'live',
  url: 'https://example.com',
  changelog: 'https://example.com/changelog',
  stack: ['Astro'],
  image: { src: 'a.png', alt: 'Alt' },
}

describe('product schema', () => {
  test('accepts a product without proof and defaults it to empty', () => {
    expect(schema.parse(valid).proof).toEqual([])
  })

  test('rejects a proof row without a date', () => {
    const proof = [{ label: 'Users', value: '1,200' }]
    expect(schema.safeParse({ ...valid, proof }).success).toBe(false)
  })

  test('rejects a proof row with an impossible date', () => {
    const proof = [{ label: 'Users', value: '1,200', date: '2026-13-40' }]
    expect(schema.safeParse({ ...valid, proof }).success).toBe(false)
  })

  test('accepts a dated proof row', () => {
    const proof = [{ label: 'Users', value: '1,200', date: '2026-09-30' }]
    expect(schema.safeParse({ ...valid, proof }).success).toBe(true)
  })

  test('rejects an unknown state', () => {
    expect(schema.safeParse({ ...valid, state: 'maybe' }).success).toBe(false)
  })
})

describe('visibleProof', () => {
  test('keeps dated rows and drops rows without value or date', () => {
    const rows = [
      { label: 'A', value: '1', date: '2026-09-30' },
      { label: 'B', value: '', date: '2026-09-30' },
      { label: 'C', value: '3', date: '' },
    ]
    expect(visibleProof(rows)).toEqual([
      { label: 'A', value: '1', date: '2026-09-30' },
    ])
  })

  test('returns nothing for absent proof', () => {
    expect(visibleProof(undefined)).toEqual([])
  })
})

describe('formatProofDate', () => {
  test('formats per language without timezone drift', () => {
    expect(formatProofDate('2026-09-01', 'en')).toBe('September 1, 2026')
    expect(formatProofDate('2026-09-01', 'es')).toBe('1 de septiembre de 2026')
  })
})

describe('fillPlaceholder', () => {
  test('replaces every occurrence literally', () => {
    expect(fillPlaceholder('Try {name} / {name}', 'name', '$& Snug')).toBe(
      'Try $& Snug / $& Snug',
    )
  })
})

describe('englishProductKeys', () => {
  test('keeps only English files, by key', () => {
    expect(
      englishProductKeys([
        './snug.es.md',
        './snug.en.md',
        '../content/products/animated-fluent-emojis.en.md',
      ]),
    ).toEqual(['animated-fluent-emojis', 'snug'])
  })
})

describe('productPath', () => {
  test('prefixes Spanish only', () => {
    expect(productPath('en', 'snug')).toBe('/products/snug/')
    expect(productPath('es', 'snug')).toBe('/es/products/snug/')
  })
})

describe('real product content', () => {
  const files = readdirSync(PRODUCTS_DIRECTORY).filter((file) =>
    file.endsWith('.md'),
  )
  const frontmatterOf = (file: string): string =>
    /^---\r?\n([\s\S]*?)\r?\n---/.exec(
      readFileSync(path.join(PRODUCTS_DIRECTORY, file), 'utf8'),
    )?.[1] ?? ''

  test('ships Snug and Animated Fluent Emojis in both languages', () => {
    expect(files.toSorted((a, b) => a.localeCompare(b))).toEqual([
      'animated-fluent-emojis.en.md',
      'animated-fluent-emojis.es.md',
      'snug.en.md',
      'snug.es.md',
    ])
  })

  test('has no StreamBoss page', () => {
    expect(files.some((file) => file.includes('streamboss'))).toBe(false)
  })

  test('every file declares the lang and key its name says', () => {
    for (const file of files) {
      const [key = '', lang = ''] = file.split('.', 2)
      const frontmatter = frontmatterOf(file)
      expect(frontmatter).toMatch(new RegExp(`^key: ${key}$`, 'm'))
      expect(frontmatter).toMatch(new RegExp(`^lang: ${lang}$`, 'm'))
    }
  })
})

describe('product parity', () => {
  test('fails when a product lacks one language', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'products-'))
    try {
      mkdirSync(path.join(root, 'src', 'pages'), { recursive: true })
      mkdirSync(path.join(root, 'src', 'content', 'products'), {
        recursive: true,
      })
      writeFileSync(
        path.join(root, 'src/content/products/snug.en.md'),
        '---\nlang: en\nkey: snug\n---\nBody',
      )
      expect(runParityCheck(root)).toEqual([
        'Content entry "snug" (src/content/products/snug.en.md) has no "es" translation.',
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
