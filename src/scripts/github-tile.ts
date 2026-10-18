import {
  computeStats,
  gridCellsHtml,
  loadLiveSnapshot,
  statsView,
  updatedLabel,
} from '../lib/github-stats'

type Fetcher = (url: string) => Promise<Response>

/** The parts of an element the script writes, so tests can fake them. */
export interface TileElement {
  textContent: string | null
  innerHTML: string
  dataset: Record<string, string | undefined>
  setAttribute: (name: string, value: string) => void
}

/** The tile root: its configuration and the elements to refresh. */
export interface GithubTileRoot {
  dataset: Record<string, string | undefined>
  querySelector: (selector: string) => TileElement | null
}

/** Options for {@link mountGithubTile}. */
export interface MountOptions {
  fetcher?: Fetcher
  now?: () => Date
}

const write = (root: GithubTileRoot, selector: string, text: string): void => {
  const element = root.querySelector(selector)
  if (element) element.textContent = text
}

const writeLabel = (root: GithubTileRoot, since: string, now: Date): void => {
  const element = root.querySelector('[data-gh-updated]')
  if (!element) return
  const label = updatedLabel(
    root.dataset.updatedPrefix ?? '',
    since,
    now,
    root.dataset.locale ?? 'en',
  )
  element.textContent = label
  element.setAttribute('datetime', since)
}

/**
 * Refreshes the server-rendered GitHub tile from the live endpoint. The
 * relative "Updated" label is always recomputed against the current time; the
 * grid, total and stats are replaced only when the endpoint answers, so a
 * failure leaves the build snapshot in place.
 * @param root The tile element and its data attributes.
 * @param options Optional fetch and clock overrides.
 * @returns True when the tile now shows live data.
 */
export async function mountGithubTile(
  root: GithubTileRoot,
  options: MountOptions = {},
): Promise<boolean> {
  const now = options.now ?? (() => new Date())
  const locale = root.dataset.locale ?? 'en'
  const live = await loadLiveSnapshot(options.fetcher)
  if (!live) {
    const since = root.dataset.capturedAt
    if (since) writeLabel(root, since, now())
    return false
  }
  const total = new Intl.NumberFormat(locale).format(live.total)
  const totalElement = root.querySelector('[data-count-total]')
  if (totalElement) {
    totalElement.textContent = total
    totalElement.dataset.countTotal = String(live.total)
  }
  const grid = root.querySelector('[data-gh-grid]')
  if (grid) {
    grid.innerHTML = gridCellsHtml(live.weeks)
    grid.setAttribute('aria-label', `${root.dataset.gridLabel ?? ''}: ${total}`)
  }
  const view = statsView(computeStats(live), locale, {
    one: root.dataset.dayOne ?? 'day',
    other: root.dataset.dayOther ?? 'days',
  })
  write(root, '[data-gh-stat="longest"]', view.longest)
  write(root, '[data-gh-stat="current"]', view.current)
  write(root, '[data-gh-stat="best"]', view.best)
  write(root, '[data-gh-stat="best-date"]', view.bestDate)
  write(root, '[data-gh-stat="active"]', view.active)
  writeLabel(root, live.updatedAt, now())
  return true
}
