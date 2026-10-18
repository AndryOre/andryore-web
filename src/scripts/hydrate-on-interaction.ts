import type { ClientDirective } from 'astro'

/** Events that count as the first interaction with an island. */
export const INTERACTION_EVENTS = [
  'pointerover',
  'pointerdown',
  'focusin',
  'touchstart',
] as const

type Hydrate = () => Promise<void>

const isClickable = (
  target: EventTarget | null,
): target is EventTarget & { click: () => void; isConnected: boolean } =>
  target !== null &&
  'click' in target &&
  typeof target.click === 'function' &&
  'isConnected' in target

/**
 * Hydrates an island on its first pointer, focus or touch interaction and
 * replays a click that landed while hydration was still running.
 * @param root The island's root element.
 * @param load Resolves the hydration function, as Astro passes to a directive.
 * @returns Resolves once the island is hydrated and any early click replayed.
 */
export async function hydrateOnInteraction(
  root: EventTarget,
  load: () => Promise<Hydrate>,
): Promise<void> {
  const earlyClick: { target: EventTarget | null } = { target: null }
  const recordClick = (event: Event): void => {
    earlyClick.target = event.target
  }

  await new Promise<void>((resolve) => {
    const start = (): void => {
      for (const eventName of INTERACTION_EVENTS) {
        root.removeEventListener(eventName, start)
      }
      resolve()
    }
    for (const eventName of INTERACTION_EVENTS) {
      root.addEventListener(eventName, start, { passive: true, once: true })
    }
    root.addEventListener('click', recordClick, { capture: true })
  })

  const hydrate = await load()
  await hydrate()
  root.removeEventListener('click', recordClick, { capture: true })

  const { target } = earlyClick
  if (isClickable(target) && target.isConnected) {
    target.click()
  }
}

async function hydrateAndReport(
  element: EventTarget,
  load: () => Promise<Hydrate>,
): Promise<void> {
  try {
    await hydrateOnInteraction(element, load)
  } catch (error) {
    console.error('client:interaction failed to hydrate', error)
  }
}

const hydrateOnInteractionDirective: ClientDirective = (
  load,
  _options,
  element,
) => {
  void hydrateAndReport(element, load)
}

export default hydrateOnInteractionDirective
