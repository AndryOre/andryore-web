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

const PANEL_SELECTORS = {
  live: '[data-stream-panel="live"]',
  offline: '[data-stream-panel="offline"]',
  unavailable: '[data-stream-panel="unavailable"]',
} as const

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
 * Upgrades the server-rendered offline tile to the live answer by showing the
 * matching panel. Without JavaScript or an endpoint the offline text stays.
 * @param root The tile element holding the three state panels.
 * @param fetcher The `fetch` to use; defaults to the platform one.
 * @returns Resolves once the tile shows the answer.
 */
export async function mountStreamTile(
  root: StreamTileRoot,
  fetcher?: Fetcher,
): Promise<void> {
  const status = await loadStreamStatus(fetcher)
  root.dataset.state = status.state
  for (const [panel, selector] of Object.entries(PANEL_SELECTORS)) {
    const element = root.querySelector(selector)
    if (element) element.hidden = panel !== status.state
  }
  if (status.state !== 'live') return
  const title = root.querySelector('[data-stream-title]')
  if (title) title.textContent = status.title
}
