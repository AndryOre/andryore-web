import { afterEach, describe, expect, spyOn, test } from 'bun:test'

type RouteHandler = () => Promise<Response>

interface ServeOptions {
  port: number
  routes: Record<string, RouteHandler>
  fetch: () => Response
}

const ENVIRONMENT_KEYS = [
  'PORT',
  'GITHUB_TOKEN',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
] as const

describe('stream status server', () => {
  const original = Object.fromEntries(
    ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]),
  )

  afterEach(() => {
    for (const key of ENVIRONMENT_KEYS) {
      Reflect.deleteProperty(process.env, key)
      const value = original[key]
      if (value !== undefined) process.env[key] = value
    }
  })

  test('binds the configured port and serves both routes without credentials', async () => {
    process.env.PORT = '4321'
    delete process.env.GITHUB_TOKEN
    delete process.env.TWITCH_CLIENT_ID
    delete process.env.TWITCH_CLIENT_SECRET
    const serve = spyOn(Bun, 'serve').mockImplementation((() => ({})) as never)

    await import('./stream-status-server')

    const options = serve.mock.calls[0]?.[0] as unknown as ServeOptions
    serve.mockRestore()
    expect(options.port).toBe(4321)
    expect(Object.keys(options.routes)).toEqual([
      '/api/stream-status',
      '/api/github-contributions',
    ])
    for (const handler of Object.values(options.routes)) {
      const response = await handler()
      expect(response.status).toBeGreaterThanOrEqual(200)
    }
    const fallback = options.fetch()
    expect(fallback.status).toBe(404)
    expect(await fallback.text()).toBe('Not found')
  })
})
