import { useEffect, useSyncExternalStore, type ReactElement } from 'react'

import {
  DARK_SCHEME_QUERY,
  THEME_PREFERENCES,
  type ThemePreference,
} from '@/lib/theme'
import {
  chooseTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  paintTheme,
  subscribeToTheme,
} from '@/lib/theme-store'

import { Button } from './ui/button'

export interface ThemeToggleCopy {
  label: string
  auto: string
  light: string
  dark: string
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

/**
 * Decorative icon of a theme preference.
 * @param props Component props.
 * @param props.preference The preference to draw.
 * @returns The SVG.
 */
export function ThemeIcon({ preference }: { preference: ThemePreference }) {
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
 * The stored theme preference, kept in sync across islands, which also
 * repaints when the system scheme changes while the preference is `auto`.
 * @returns The current preference.
 */
export function useThemePreference(): ThemePreference {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  )

  useEffect(() => {
    const query = matchMedia(DARK_SCHEME_QUERY)
    const repaint = (): void => {
      paintTheme(getThemeSnapshot())
    }
    query.addEventListener('change', repaint)
    return () => {
      query.removeEventListener('change', repaint)
    }
  }, [])

  return preference
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
  const preference = useThemePreference()

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
            chooseTheme(option)
          }}
        >
          <ThemeIcon preference={option} />
        </Button>
      ))}
    </div>
  )
}
