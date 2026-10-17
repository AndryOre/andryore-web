import { describe, expect, test } from 'bun:test'

import type { StreamStatus } from '../lib/twitch-status'
import {
  loadStreamStatus,
  mountStreamTile,
  STATUS_ENDPOINT,
  type StreamTileRoot,
} from './stream-tile'

const respond =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(Response.json(body, { status }))

const createRoot = () => {
  const panels = {
    live: { hidden: true },
    offline: { hidden: false },
    unavailable: { hidden: true },
  }
  const title = { hidden: false, textContent: '' }
  const root: StreamTileRoot = {
    dataset: { state: 'offline' },
    querySelector: (selector: string) => {
      if (selector === '[data-stream-title]') return title
      const match = /\[data-stream-panel="(\w+)"\]/.exec(selector)
      const name = match?.[1]
      return new Map(Object.entries(panels)).get(name ?? '') ?? null
    },
  }
  return { root, panels, title }
}

describe('loadStreamStatus', () => {
  test('reads a live payload', async () => {
    const status = await loadStreamStatus(
      respond({ state: 'live', title: 'Hello' }),
    )
    expect(status).toEqual({ state: 'live', title: 'Hello' })
  })

  test('reads an offline payload', async () => {
    expect(await loadStreamStatus(respond({ state: 'offline' }))).toEqual({
      state: 'offline',
    })
  })

  test('is unavailable on a failed request, bad status or bad payload', async () => {
    const unavailable: StreamStatus = { state: 'unavailable' }
    expect(
      await loadStreamStatus(() => Promise.reject(new Error('down'))),
    ).toEqual(unavailable)
    expect(await loadStreamStatus(respond({}, 502))).toEqual(unavailable)
    expect(await loadStreamStatus(respond({ state: 'weird' }))).toEqual(
      unavailable,
    )
    expect(await loadStreamStatus(respond('text'))).toEqual(unavailable)
  })

  test('calls only the same-origin endpoint', async () => {
    const urls: string[] = []
    await loadStreamStatus((url) => {
      urls.push(url)
      return Promise.resolve(new Response('{}'))
    })
    expect(urls).toEqual([STATUS_ENDPOINT])
    expect(STATUS_ENDPOINT.startsWith('/')).toBe(true)
  })
})

describe('mountStreamTile', () => {
  test('shows the live panel with the stream title', async () => {
    const { root, panels, title } = createRoot()
    await mountStreamTile(root, respond({ state: 'live', title: 'On air' }))
    expect(root.dataset.state).toBe('live')
    expect(title.textContent).toBe('On air')
    expect(panels.live.hidden).toBe(false)
    expect(panels.offline.hidden).toBe(true)
    expect(panels.unavailable.hidden).toBe(true)
  })

  test('shows the unavailable panel when the endpoint is down', async () => {
    const { root, panels } = createRoot()
    await mountStreamTile(root, () => Promise.reject(new Error('down')))
    expect(root.dataset.state).toBe('unavailable')
    expect(panels.unavailable.hidden).toBe(false)
    expect(panels.offline.hidden).toBe(true)
  })

  test('keeps the offline panel for an offline answer', async () => {
    const { root, panels } = createRoot()
    await mountStreamTile(root, respond({ state: 'offline' }))
    expect(panels.offline.hidden).toBe(false)
    expect(panels.live.hidden).toBe(true)
  })
})
