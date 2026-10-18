import {
  formatCountdown,
  formatSession,
  nextSession,
  selectStreamView,
  type StreamView,
} from '../lib/stream-state'
import type { StreamStatus } from '../lib/twitch-status'

/** The same-origin path of the Live status endpoint (ADR 0004). */
export const STATUS_ENDPOINT = '/api/stream-status'

type Fetcher = (url: string) => Promise<Response>

/** The parts of the tile root the script touches, so tests can fake them. */
export interface StreamTileRoot {
  dataset: Record<string, string | undefined>
  querySelector: (
    selector: string,
  ) => { hidden: boolean; textContent?: string | null } | null
}

const PANEL_SELECTORS: Readonly<Record<StreamView, string>> = {
  'coming-soon': '[data-stream-panel="coming-soon"]',
  scheduled: '[data-stream-panel="scheduled"]',
  live: '[data-stream-panel="live"]',
  unavailable: '[data-stream-panel="unavailable"]',
}

const UNAVAILABLE: StreamStatus = { state: 'unavailable' }

const isStreamStatus = (value: unknown): value is StreamStatus => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { state?: unknown; title?: unknown }
  return candidate.state === 'live'
    ? typeof candidate.title === 'string'
    : candidate.state === 'offline' || candidate.state === 'unavailable'
}

/**
 * Asks the same-origin endpoint for the Live status.
 * @param fetcher The `fetch` to use; defaults to the platform one.
 * @returns The status, or unavailable when the request or payload fails.
 */
export async function loadStreamStatus(
  fetcher: Fetcher = (url) => fetch(url, { credentials: 'omit' }),
): Promise<StreamStatus> {
  try {
    const response = await fetcher(STATUS_ENDPOINT)
    if (!response.ok) return UNAVAILABLE
    const body: unknown = await response.json()
    return isStreamStatus(body) ? body : UNAVAILABLE
  } catch {
    return UNAVAILABLE
  }
}

/**
 * Picks the view from the live answer and the `data-started` flag, then shows
 * only the matching panel. Without JavaScript the server-rendered coming-soon
 * slate stays.
 * @param root The tile element holding the four state panels.
 * @param fetcher The `fetch` to use; defaults to the platform one.
 * @param now The current moment, injectable for tests.
 * @returns Resolves once the tile shows the answer.
 */
export async function mountStreamTile(
  root: StreamTileRoot,
  fetcher?: Fetcher,
  now: Date = new Date(),
): Promise<void> {
  const status = await loadStreamStatus(fetcher)
  const view = selectStreamView(status, root.dataset.started === 'true')
  root.dataset.state = view
  for (const [panel, selector] of Object.entries(PANEL_SELECTORS)) {
    const element = root.querySelector(selector)
    if (element) element.hidden = panel !== view
  }
  const tag = root.querySelector('[data-stream-live-tag]')
  if (tag) tag.hidden = view !== 'live'
  if (status.state === 'live') {
    const title = root.querySelector('[data-stream-title]')
    if (title) title.textContent = status.title
  }
  if (view !== 'scheduled') return
  const locale = root.dataset.locale ?? 'en'
  const start = nextSession(now)
  const next = root.querySelector('[data-stream-next]')
  if (next) next.textContent = formatSession(start, locale)
  const countdown = root.querySelector('[data-stream-countdown]')
  if (countdown) countdown.textContent = formatCountdown(start, now, locale)
}
