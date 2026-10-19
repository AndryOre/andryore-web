import {
  applyResolvedTheme,
  DARK_SCHEME_QUERY,
  getThemeStorage,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from './theme'

const FADE_CLASS = 'theme-fade'
const FADE_DURATION_MS = 400

const listeners = new Set<() => void>()
const memory: { preference: ThemePreference | null } = { preference: null }

/**
 * Subscribes to preference changes made by any island or another tab.
 * @param onChange Called after the preference changes.
 * @returns A function that unsubscribes.
 */
export const subscribeToTheme = (onChange: () => void): (() => void) => {
  listeners.add(onChange)
  globalThis.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    globalThis.removeEventListener('storage', onChange)
  }
}

/**
 * Reads the current preference, preferring the in-memory choice used when
 * storage is unavailable.
 * @returns The current preference.
 */
export const getThemeSnapshot = (): ThemePreference =>
  memory.preference ?? readThemePreference(getThemeStorage())

/**
 * The preference rendered on the server, before any choice is known.
 * @returns Always `auto`.
 */
export const getServerThemeSnapshot = (): ThemePreference => 'auto'

/**
 * Paints a preference on the document, resolving `auto` against the system.
 * @param preference The preference to paint.
 */
export const paintTheme = (preference: ThemePreference): void => {
  applyResolvedTheme(
    document,
    resolveTheme(preference, matchMedia(DARK_SCHEME_QUERY).matches),
  )
}

/**
 * Applies, paints and stores a theme preference, fading colours briefly.
 * Choosing the preference already in effect does nothing, so a drag across one
 * stop neither restarts the fade nor rewrites storage.
 * @param preference The choice to apply.
 */
export const chooseTheme = (preference: ThemePreference): void => {
  if (preference === getThemeSnapshot()) return
  const root = document.documentElement
  root.classList.add(FADE_CLASS)
  root.dataset.themePref = preference
  paintTheme(preference)
  setTimeout(() => {
    root.classList.remove(FADE_CLASS)
  }, FADE_DURATION_MS)
  const stored = writeThemePreference(getThemeStorage(), preference)
  memory.preference = stored ? null : preference
  for (const listener of listeners) listener()
}
