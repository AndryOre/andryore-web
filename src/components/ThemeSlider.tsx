import { useRef, type KeyboardEvent, type PointerEvent } from 'react'

import type { ThemePreference } from '@/lib/theme'
import { stopAfterKey, stopFromRatio, THEME_STOPS } from '@/lib/theme-stops'
import { chooseTheme } from '@/lib/theme-store'
import { cn } from '@/lib/utils'

import { useThemePreference, type ThemeToggleCopy } from './ThemeToggle'

const STOP_PATHS: Readonly<Record<ThemePreference, readonly string[]>> = {
  light: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4',
  ],
  auto: [
    'M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4',
    'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4',
  ],
  dark: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
}

/**
 * Lucide `sun`, `sun-moon` or `moon` for a stop.
 * @param props Component props.
 * @param props.stop The stop to draw.
 * @returns The decorative SVG.
 */
function StopIcon({ stop }: { stop: ThemePreference }) {
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
      {STOP_PATHS[stop].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}

const STOP_OFFSET_CLASS: Readonly<Record<ThemePreference, string>> = {
  light: 'top-0',
  auto: 'top-1/3',
  dark: 'top-2/3',
}

/**
 * Brightness-style vertical theme control with three stops: Light, Auto and
 * Dark. The track is one `slider`; arrow keys step between the stops and a
 * press on the track jumps to the nearest one.
 * @param props Component props.
 * @param props.copy Localised labels.
 * @returns The control.
 */
export default function ThemeSlider({ copy }: { copy: ThemeToggleCopy }) {
  const preference = useThemePreference()
  const trackRef = useRef<HTMLDivElement>(null)
  const index = THEME_STOPS.indexOf(preference)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = stopAfterKey(index, event.key)
    if (next === null) return
    event.preventDefault()
    const stop = THEME_STOPS[next]
    if (stop) chooseTheme(stop)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const box = trackRef.current?.getBoundingClientRect()
    if (!box || box.height === 0) return
    const next = stopFromRatio((event.clientY - box.top) / box.height)
    const stop = THEME_STOPS[next]
    if (stop) chooseTheme(stop)
  }

  return (
    <div className="flex items-center gap-4">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={copy.label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={THEME_STOPS.length - 1}
        aria-valuenow={index}
        aria-valuetext={copy[preference]}
        data-theme-slider
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        className="relative flex h-36 w-12 shrink-0 cursor-pointer touch-none flex-col rounded-pill border border-border bg-secondary p-1"
      >
        <span aria-hidden="true" className="absolute inset-1">
          <span
            className={cn(
              'absolute inset-x-0 h-1/3 rounded-full bg-foreground transition-all duration-200 ease-out motion-reduce:transition-none',
              STOP_OFFSET_CLASS[preference],
            )}
          />
        </span>
        {THEME_STOPS.map((stop) => (
          <span
            key={stop}
            aria-hidden="true"
            className={cn(
              'relative grid flex-1 place-items-center [&>svg]:size-5',
              stop === preference ? 'text-background' : 'text-muted-foreground',
            )}
          >
            <StopIcon stop={stop} />
          </span>
        ))}
      </div>
      <ul className="m-0 flex h-36 list-none flex-col border border-transparent py-1 font-mono text-xs">
        {THEME_STOPS.map((stop) => (
          <li
            key={stop}
            className={cn(
              'grid flex-1 items-center',
              stop === preference ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {copy[stop]}
          </li>
        ))}
      </ul>
    </div>
  )
}
