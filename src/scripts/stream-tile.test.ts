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

const createRoot = (started: boolean) => {
  const panels = {
    'coming-soon': { hidden: false },
    scheduled: { hidden: true },
    live: { hidden: true },
    unavailable: { hidden: true },
  }
  const title = { hidden: false, textContent: '' }
  const next = { hidden: false, textContent: '' }
  const countdown = { hidden: false, textContent: '' }
  const root: StreamTileRoot = {
    dataset: { state: 'coming-soon', started: String(started), locale: 'en' },
    querySelector: (selector: string) => {
      if (selector === '[data-stream-title]') return title
      if (selector === '[data-stream-next]') return next
      if (selector === '[data-stream-countdown]') return countdown
      const match = /\[data-stream-panel="([\w-]+)"\]/.exec(selector)
      return new Map(Object.entries(panels)).get(match?.[1] ?? '') ?? null
    },
  }
  return { root, panels, title, next, countdown }
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
  const now = new Date('2026-10-18T19:00:00Z')

  test('shows the live panel with the stream title', async () => {
    const { root, panels, title } = createRoot(false)
    await mountStreamTile(
      root,
      respond({ state: 'live', title: 'On air' }),
      now,
    )
    expect(root.dataset.state).toBe('live')
    expect(title.textContent).toBe('On air')
    expect(panels.live.hidden).toBe(false)
    expect(panels['coming-soon'].hidden).toBe(true)
  })

  test('keeps coming soon before streams start', async () => {
    const { root, panels } = createRoot(false)
    await mountStreamTile(root, respond({ state: 'offline' }), now)
    expect(root.dataset.state).toBe('coming-soon')
    expect(panels['coming-soon'].hidden).toBe(false)
    expect(panels.scheduled.hidden).toBe(true)
  })

  test('shows the schedule with the next session once started', async () => {
    const { root, panels, next, countdown } = createRoot(true)
    await mountStreamTile(root, respond({ state: 'offline' }), now)
    expect(panels.scheduled.hidden).toBe(false)
    expect(next.textContent).toBe('Tue 19:00 UTC')
    expect(countdown.textContent).toBe('in 2 days')
  })

  test('shows unavailable once started and the endpoint is down', async () => {
    const { root, panels } = createRoot(true)
    await mountStreamTile(root, () => Promise.reject(new Error('down')), now)
    expect(root.dataset.state).toBe('unavailable')
    expect(panels.unavailable.hidden).toBe(false)
    expect(panels.scheduled.hidden).toBe(true)
  })
})
