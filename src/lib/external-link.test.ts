import { describe, expect, test } from 'bun:test'

import {
  externalLinkTokens,
  isExternalHref,
  tokensForHref,
} from './external-link'

describe('external links', () => {
  test('detects absolute http and https targets only', () => {
    expect(isExternalHref('https://github.com/x')).toBe(true)
    expect(isExternalHref('https://example.com')).toBe(true)
    expect(isExternalHref('/about/')).toBe(false)
    expect(isExternalHref('mailto:hello@andryore.dev')).toBe(false)
  })

  test('always carries noopener and noreferrer', () => {
    expect(externalLinkTokens()).toBe('noopener noreferrer')
    expect(externalLinkTokens({ sponsored: true })).toBe(
      'sponsored noopener noreferrer',
    )
  })

  test('internal links get no rel', () => {
    expect(tokensForHref('/uses/')).toBeUndefined()
    expect(tokensForHref('https://twitch.tv/x')).toBe('noopener noreferrer')
  })
})
