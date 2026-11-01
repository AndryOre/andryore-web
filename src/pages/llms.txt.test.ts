import { describe, expect, test } from 'bun:test'

import { GET } from './llms.txt'

describe('llms.txt endpoint', () => {
  test('serves plain text listing the pages', async () => {
    const response = (GET as () => Response)()
    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    )
    const body = await response.text()
    expect(body).toContain('/about/')
    expect(body).toContain('/uses/')
  })
})
