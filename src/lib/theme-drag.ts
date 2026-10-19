import type { ThemePreference } from './theme'
import {
  levelFromRatio,
  squeezeForLevel,
  stopFromLevel,
  stopFromRatio,
  THEME_STOPS,
} from './theme-stops'

/** The box of the brightness bar that a pointer position is measured in. */
interface BarBox {
  top: number
  height: number
}

/**
 * The part of the brightness bar the drag reads and writes: its box and the
 * custom properties that carry the live level.
 * @public
 */
export interface DragBar {
  getBoundingClientRect: () => BarBox
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>
}

const browserMatchMedia = (query: string): { matches: boolean } | undefined =>
  typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia(query)
    : undefined

/**
 * Whether the visitor asked the system to reduce motion.
 * @param match Answers a media query; defaults to the browser's `matchMedia`.
 * @returns True when `prefers-reduced-motion: reduce` matches.
 */
export function prefersReducedMotion(match = browserMatchMedia): boolean {
  return match('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/**
 * Where a pointer sits in the bar as a ratio from the top, or `undefined`
 * while the bar has no box to measure in.
 * @param bar The bar, if mounted.
 * @param clientY The pointer's vertical position in the viewport.
 * @returns The ratio, `0` at the top edge and `1` at the bottom edge.
 */
function ratioAt(bar: DragBar | null, clientY: number): number | undefined {
  const box = bar?.getBoundingClientRect()
  return !box || box.height === 0 ? undefined : (clientY - box.top) / box.height
}

/**
 * Writes the live level under the pointer to the bar's custom properties, so
 * the fill and the sun follow it without a render. Stays inside 0 to 100 under
 * reduced motion; otherwise it rubber-bands past both ends.
 * @param bar The bar, if mounted.
 * @param clientY The pointer's vertical position in the viewport.
 * @param level Receives the level that was written.
 * @param level.current The last written level.
 * @param reducedMotion Whether to clamp instead of rubber-band.
 */
export function followPointer(
  bar: DragBar | null,
  clientY: number,
  level: { current: number },
  reducedMotion: boolean = prefersReducedMotion(),
): void {
  const ratio = ratioAt(bar, clientY)
  if (!bar || ratio === undefined) return
  const banded = levelFromRatio(ratio)
  const next = reducedMotion ? Math.min(100, Math.max(0, banded)) : banded
  level.current = next
  bar.style.setProperty('--drag-level', String(next))
  bar.style.setProperty('--drag-squeeze', String(squeezeForLevel(next)))
}

/**
 * Ends a drag: removes the live level so the stored stop takes over again.
 * @param bar The bar, if mounted.
 * @param level The last level written while dragging.
 * @returns The stop nearest to that level.
 */
export function releaseDrag(
  bar: DragBar | null,
  level: number,
): ThemePreference | undefined {
  bar?.style.removeProperty('--drag-level')
  bar?.style.removeProperty('--drag-squeeze')
  return THEME_STOPS[stopFromLevel(level)]
}

/**
 * The stop under a pointer, for a press that starts no drag.
 * @param bar The bar, if mounted.
 * @param clientY The pointer's vertical position in the viewport.
 * @returns The stop in that third of the bar, if the bar can be measured.
 */
export function pickAtPointer(
  bar: DragBar | null,
  clientY: number,
): ThemePreference | undefined {
  const ratio = ratioAt(bar, clientY)
  return ratio === undefined ? undefined : THEME_STOPS[stopFromRatio(ratio)]
}
