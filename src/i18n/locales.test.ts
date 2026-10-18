import { describe, expect, test } from 'bun:test'

import {
  absoluteUrl,
  alternatesFor,
  homePath,
  localePath,
  LOCALES,
  otherLocale,
  splitLocalePath,
} from './locales'

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

describe('localePath', () => {
  test('keeps English paths unprefixed', () => {
    expect(localePath('en', '/log/')).toBe('/log/')
  })

  test('prefixes Spanish paths with /es', () => {
    expect(localePath('es', '/log/')).toBe('/es/log/')
    expect(localePath('es', '/')).toBe('/es/')
  })
})

describe('splitLocalePath', () => {
  test('reads English paths', () => {
    expect(splitLocalePath('/log/')).toEqual({ locale: 'en', path: '/log/' })
  })

  test('reads Spanish paths and strips the prefix', () => {
    expect(splitLocalePath('/es/log/')).toEqual({ locale: 'es', path: '/log/' })
    expect(splitLocalePath('/es/')).toEqual({ locale: 'es', path: '/' })
    expect(splitLocalePath('/es')).toEqual({ locale: 'es', path: '/' })
  })

  test('does not mistake a path that merely starts with es', () => {
    expect(splitLocalePath('/estudio/')).toEqual({
      locale: 'en',
      path: '/estudio/',
    })
  })
})

describe('otherLocale', () => {
  test('swaps the language', () => {
    expect(otherLocale('en')).toBe('es')
    expect(otherLocale('es')).toBe('en')
  })
})

describe('alternatesFor', () => {
  test('lists both languages with hreflang and paths', () => {
    expect(alternatesFor('/log/')).toEqual([
      { locale: 'en', hreflang: 'en', path: '/log/' },
      { locale: 'es', hreflang: 'es', path: '/es/log/' },
    ])
  })
})

describe('absoluteUrl', () => {
  test('anchors a path on the production origin', () => {
    expect(absoluteUrl('/es/')).toBe('https://andryore.dev/es/')
  })
})
