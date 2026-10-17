import { describe, expect, test } from 'bun:test'

import { personJsonLd } from './person'

describe('personJsonLd', () => {
  test('describes a Person at the localized About url', () => {
    const parsed = JSON.parse(personJsonLd('es', 'Hola')) as Record<
      string,
      unknown
    >
    expect(parsed['@type']).toBe('Person')
    expect(parsed.url).toBe('https://andryore.dev/es/about/')
    expect(parsed.description).toBe('Hola')
  })

  test('never states a job title or an email', () => {
    const json = personJsonLd('en', 'x')
    expect(json).not.toContain('jobTitle')
    expect(json).not.toContain('email')
  })

  test('escapes angle brackets', () => {
    expect(personJsonLd('en', '</script>')).not.toContain('<')
  })
})
