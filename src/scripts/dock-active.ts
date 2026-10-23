import {
  activeSectionKey,
  hashSectionKey,
  HOME_SECTION_IDS,
  type DockPageKey,
} from '../lib/dock'

/** The parts of a dock link the home scroll spy touches. */
export interface DockAnchor {
  dataset: { dockPage?: string }
  setAttribute: (name: string, value: string) => void
  removeAttribute: (name: string) => void
}

/** A home section reported by the observer. */
export interface SectionEntry {
  target: { id: string }
  isIntersecting: boolean
}

interface SectionObserver {
  observe(target: object): void
}

export interface DockActiveOptions {
  anchors: readonly DockAnchor[]
  findSection: (id: string) => object | null
  hash: string
  createObserver:
    | ((callback: (entries: SectionEntry[]) => void) => SectionObserver)
    | undefined
}

/**
 * Marks the dock link of the home section in view with `aria-current="page"`
 * and clears the others, starting from the location hash so arrival on
 * `/#products` is right before the first observer report. It works on the
 * server-rendered links, so it does not wait for the Dock island to hydrate.
 * @param options The dock links, the section lookup, the hash and the
 *   observer factory; without a factory only the hash is applied.
 */
export function mountDockActive(options: DockActiveOptions): void {
  const { anchors, findSection, hash, createObserver } = options
  const paint = (key: DockPageKey): void => {
    for (const anchor of anchors) {
      if (anchor.dataset.dockPage === key) {
        anchor.setAttribute('aria-current', 'page')
      } else {
        anchor.removeAttribute('aria-current')
      }
    }
  }
  paint(hashSectionKey(hash))
  if (!createObserver) return

  const visible = new Set<string>()
  const observer = createObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target.id)
      else visible.delete(entry.target.id)
    }
    paint(activeSectionKey([...visible]))
  })
  for (const id of HOME_SECTION_IDS) {
    const section = findSection(id)
    if (section) observer.observe(section)
  }
}
