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

import productUi from '../content/product-ui.json'
import { runParityCheck } from '../i18n/parity-check'
import {
  classifyIcon,
  createProductSchema,
  englishProductKeys,
  fillPlaceholder,
  formatProofDate,
  headerLinks,
  productPath,
  SKIN_TONE_CLASSES,
  stackIconId,
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
  year: '2024',
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
      'json-flow.en.md',
      'json-flow.es.md',
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

describe('real product data', () => {
  const files = readdirSync(PRODUCTS_DIRECTORY).filter((file) =>
    file.endsWith('.md'),
  )
  const parse = (file: string): Record<string, unknown> => {
    const raw = readFileSync(path.join(PRODUCTS_DIRECTORY, file), 'utf8')
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1] ?? ''
    const data: unknown = Bun.YAML.parse(frontmatter)
    return z.record(z.string(), z.unknown()).parse(data)
  }
  const realSchema = createProductSchema(z.string())
  const urlsOf = (value: unknown): string[] => {
    if (typeof value === 'string') return /^https?:/.test(value) ? [value] : []
    return typeof value !== 'object' || value === null
      ? []
      : Object.values(value).flatMap((inner) => urlsOf(inner))
  }

  test('every file passes the product schema', () => {
    for (const file of files) {
      expect(realSchema.safeParse(parse(file)).success).toBe(true)
    }
  })

  test('no live entry is a draft, placeholder or sample', () => {
    for (const file of files) {
      const data = realSchema.parse(parse(file))
      expect(data.draft).toBe(false)
      expect(data.image.placeholder).toBe(false)
      expect(JSON.stringify(data).toLowerCase()).not.toContain('sample')
    }
  })

  test('every link is https', () => {
    for (const file of files) {
      const urls = urlsOf(parse(file))
      expect(urls.length).toBeGreaterThan(0)
      for (const url of urls) expect(url).toMatch(/^https:\/\//)
    }
  })

  test('both languages carry the same facts', () => {
    const englishFiles = files.filter((name) => name.endsWith('.en.md'))
    for (const file of englishFiles) {
      const english = realSchema.parse(parse(file))
      const spanish = realSchema.parse(parse(file.replace('.en.md', '.es.md')))
      expect(spanish.key).toBe(english.key)
      expect(spanish.kind).toBe(english.kind)
      expect(spanish.version).toBe(english.version)
      expect(spanish.year).toBe(english.year)
      expect(spanish.stack).toEqual(english.stack)
      expect(spanish.stats.map((stat) => stat.date)).toEqual(
        english.stats.map((stat) => stat.date),
      )
      expect(spanish.cards).toHaveLength(english.cards.length)
      expect(spanish.platforms.map((item) => item.icon)).toEqual(
        english.platforms.map((item) => item.icon),
      )
      expect(spanish.gallery).toHaveLength(english.gallery.length)
      expect(spanish.sprites.map((item) => item.frames)).toEqual(
        english.sprites.map((item) => item.frames),
      )
    }
  })

  test('Snug and Animated Fluent Emojis are shipped, not beta', () => {
    for (const key of ['snug', 'animated-fluent-emojis']) {
      const data = realSchema.parse(parse(`${key}.en.md`))
      expect(data.state).toBe('live')
      expect(data.kind).toBe('product')
      expect(data.year).toBe('2024')
    }
    expect(realSchema.parse(parse('snug.en.md')).version).toBe('v2.2.0')
    expect(
      realSchema.parse(parse('animated-fluent-emojis.en.md')).version,
    ).toBe('v0.8.0')
  })

  test('Snug does not claim a Firefox or Safari build', () => {
    const snug = realSchema.parse(parse('snug.en.md'))
    expect(snug.platforms.map((item) => item.label)).toEqual([
      'Chrome',
      'Edge',
      'Brave',
      'Opera',
    ])
    expect(snug.importsFrom.map((item) => item.label)).toEqual([
      'Firefox',
      'Safari',
    ])
  })

  test('JSON Flow is a contribution with a dated install figure', () => {
    for (const lang of ['en', 'es']) {
      const data = realSchema.parse(parse(`json-flow.${lang}.md`))
      expect(data.kind).toBe('contribution')
      expect(data.state).toBe('contribution')
      expect(data.tag).toMatch(/^(Contribution|Colaboración) · /)
      expect(data.year).toBe('2024–25')
      expect(data.stats[0]?.date).toBe('2026-10-18')
      expect(data.stats[0]?.value).toMatch(/^75[.,]000\+$/)
      expect(data.importFormats).toHaveLength(4)
      expect(data.exportFormats).toHaveLength(3)
      expect(data.changelog).toBeUndefined()
    }
  })

  test('JSON Flow copy never claims the current version or commit counts', () => {
    for (const lang of ['en', 'es']) {
      const raw = readFileSync(
        path.join(PRODUCTS_DIRECTORY, `json-flow.${lang}.md`),
        'utf8',
      )
      expect(raw).not.toMatch(/\bv2\b/)
      expect(raw.toLowerCase()).not.toMatch(/commits?\b/)
    }
  })

  test('every sprite strip is a copied local asset', () => {
    const data = realSchema.parse(parse('animated-fluent-emojis.en.md'))
    expect(data.sprites.map((sprite) => sprite.frames)).toEqual([48, 61, 1, 48])
    for (const sprite of data.sprites) {
      expect(sprite.src).toStartWith('../../assets/products/sprites/')
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

describe('headerLinks', () => {
  const base = { url: 'https://site.example', links: {} }

  test('lists the website first, then the source', () => {
    expect(
      headerLinks({
        ...base,
        links: { source: 'https://github.com/a/b' },
      }),
    ).toEqual([
      { id: 'website', href: 'https://site.example' },
      { id: 'source', href: 'https://github.com/a/b' },
    ])
  })

  test('adds npm and the marketplace only when present', () => {
    const ids = headerLinks({
      ...base,
      links: {
        npm: 'https://npm.example/p',
        marketplace: 'https://market.example/p',
      },
    }).map((link) => link.id)
    expect(ids).toEqual(['website', 'npm', 'marketplace'])
  })
})

describe('stackIconId', () => {
  test('maps known stack names to a brand icon', () => {
    expect(stackIconId('React')).toBe('react')
    expect(stackIconId('Tailwind CSS')).toBe('tailwindcss')
    expect(stackIconId('shadcn/ui')).toBe('shadcn-ui')
    expect(stackIconId('Astro + Starlight')).toBe('astro')
  })

  test('returns nothing for an unknown name', () => {
    expect(stackIconId('Obscure')).toBeUndefined()
  })
})

describe('SKIN_TONE_CLASSES', () => {
  test('has one distinct swatch per UI label', () => {
    expect(new Set(SKIN_TONE_CLASSES).size).toBe(6)
    expect(productUi.en.skinTones).toHaveLength(6)
    expect(productUi.es.skinTones).toHaveLength(6)
  })
})

describe('product UI copy', () => {
  test('never claims v2 or commit counts', () => {
    expect(JSON.stringify(productUi)).not.toMatch(/\bv2\b|commits?\b/i)
  })

  test('has the same keys in both languages', () => {
    expect(
      Object.keys(productUi.es).toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(Object.keys(productUi.en).toSorted((a, b) => a.localeCompare(b)))
  })
})

describe('classifyIcon', () => {
  test('tells brand logos from glyphs and rejects unknown names', () => {
    expect(classifyIcon('chrome')).toEqual({ kind: 'brand', id: 'chrome' })
    expect(classifyIcon('eye')).toEqual({ kind: 'glyph', name: 'eye' })
    expect(classifyIcon('nope')).toBeUndefined()
  })

  test('resolves every icon the product files use', () => {
    for (const file of readdirSync(PRODUCTS_DIRECTORY)) {
      const raw = readFileSync(path.join(PRODUCTS_DIRECTORY, file), 'utf8')
      const names = raw
        .matchAll(/^\s*(?:- )?icon: '([^']+)'/gm)
        .map((match) => match[1] ?? '')
        .toArray()
      expect(names.length).toBeGreaterThan(0)
      for (const name of names) {
        expect(classifyIcon(name), `${file}: ${name}`).toBeDefined()
      }
    }
  })
})
