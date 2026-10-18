import type { ThemePreference } from './theme'

/** The slider stops from top to bottom, brightest first. */
export const THEME_STOPS: readonly ThemePreference[] = ['light', 'auto', 'dark']

/**
 * Moves a stop index by a key press. Down and right go towards Dark, up and
 * left towards Light.
 * @param index The current stop index.
 * @param key The pressed key.
 * @returns The new index, or null when the key does not move the slider.
 */
export function stopAfterKey(index: number, key: string): number | null {
  const last = THEME_STOPS.length - 1
  if (key === 'ArrowDown' || key === 'ArrowRight') {
    return Math.min(last, index + 1)
  }
  if (key === 'ArrowUp' || key === 'ArrowLeft') return Math.max(0, index - 1)
  if (key === 'Home') return 0
  return key === 'End' ? last : null
}

/**
 * Finds the stop under a press on the track.
 * @param ratio Vertical position on the track, 0 at the top and 1 at the
 * bottom.
 * @returns The index of the stop whose third of the track holds the press.
 */
export function stopFromRatio(ratio: number): number {
  return Math.min(
    THEME_STOPS.length - 1,
    Math.max(0, Math.floor(ratio * THEME_STOPS.length)),
  )
}
