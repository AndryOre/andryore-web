import { describe, expect, test } from 'bun:test'

import { GET } from './robots.txt'

describe('robots.txt endpoint', () => {
  test('serves plain text that points at the sitemap', async () => {
    const response = (GET as () => Response)()
    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    )
    expect(await response.text()).toContain('Sitemap: ')
  })
})
