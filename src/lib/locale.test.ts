import { describe, expect, test } from 'bun:test'

import { homePath, LOCALES } from './locale'

describe('homePath', () => {
  test('serves English at the root', () => {
    expect(homePath('en')).toBe('/')
  })

  test('serves Spanish under /es/', () => {
    expect(homePath('es')).toBe('/es/')
  })

  test('covers every locale', () => {
    expect(LOCALES.map((locale) => homePath(locale))).toEqual(['/', '/es/'])
  })
})
