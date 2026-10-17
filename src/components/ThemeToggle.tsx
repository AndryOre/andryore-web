import { useEffect, useSyncExternalStore, type ReactElement } from 'react'

import {
  applyResolvedTheme,
  DARK_SCHEME_QUERY,
  getThemeStorage,
  readThemePreference,
  resolveTheme,
  THEME_PREFERENCES,
  writeThemePreference,
  type ThemePreference,
} from '@/lib/theme'

import { Button } from './ui/button'

export interface ThemeToggleCopy {
  label: string
  auto: string
  light: string
  dark: string
}

const FADE_CLASS = 'theme-fade'
const FADE_DURATION_MS = 400

const listeners = new Set<() => void>()
const memory: { preference: ThemePreference | null } = { preference: null }

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange)
  globalThis.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    globalThis.removeEventListener('storage', onChange)
  }
}

const getSnapshot = (): ThemePreference =>
  memory.preference ?? readThemePreference(getThemeStorage())

const getServerSnapshot = (): ThemePreference => 'auto'

const paint = (preference: ThemePreference): void => {
  applyResolvedTheme(
    document,
    resolveTheme(preference, matchMedia(DARK_SCHEME_QUERY).matches),
  )
}

const choose = (preference: ThemePreference): void => {
  const root = document.documentElement
  root.classList.add(FADE_CLASS)
  paint(preference)
  setTimeout(() => {
    root.classList.remove(FADE_CLASS)
  }, FADE_DURATION_MS)
  const stored = writeThemePreference(getThemeStorage(), preference)
  memory.preference = stored ? null : preference
  for (const listener of listeners) listener()
}

const ICON_PATHS: Record<ThemePreference, ReactElement> = {
  auto: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[preference]}
    </svg>
  )
}

/**
 * Three-state theme control: Auto, Light and Dark. Each option is a toggle
 * button inside a labelled group, so assistive tech hears the current state
 * and every option is a tab stop.
 * @param props Component props.
 * @param props.copy Localised labels.
 * @returns The control.
 */
export default function ThemeToggle({ copy }: { copy: ThemeToggleCopy }) {
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  useEffect(() => {
    const query = matchMedia(DARK_SCHEME_QUERY)
    const repaint = (): void => {
      paint(getSnapshot())
    }
    query.addEventListener('change', repaint)
    return () => {
      query.removeEventListener('change', repaint)
    }
  }, [])

  return (
    <div
      role="group"
      aria-label={copy.label}
      className="flex items-center gap-0.5 rounded-pill border border-border bg-card p-0.5"
    >
      {THEME_PREFERENCES.map((option) => (
        <Button
          key={option}
          variant={preference === option ? 'secondary' : 'ghost'}
          size="icon"
          aria-pressed={preference === option}
          aria-label={copy[option]}
          title={copy[option]}
          onClick={() => {
            choose(option)
          }}
        >
          <ThemeIcon preference={option} />
        </Button>
      ))}
    </div>
  )
}
