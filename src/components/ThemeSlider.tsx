import {
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import type { ThemePreference } from '@/lib/theme'
import { stopAfterKey, stopFromRatio, THEME_STOPS } from '@/lib/theme-stops'
import { chooseTheme } from '@/lib/theme-store'
import { cn } from '@/lib/utils'

import { useThemePreference, type ThemeToggleCopy } from './ThemeToggle'

const unsubscribeNothing = (): void => undefined
const subscribeToNothing = (): (() => void) => unsubscribeNothing
const readHydrated = (): boolean => true
const readNotHydrated = (): boolean => false

const RAY_PATH =
  'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4'

const STOP_PATHS: Readonly<Record<ThemePreference, readonly string[]>> = {
  light: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', RAY_PATH],
  auto: ['M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4', RAY_PATH],
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

/**
 * The sun at the foot of the brightness bar. It turns with the level and its
 * rays fade with it, through the `--strength` custom property.
 * @returns The decorative SVG.
 */
function BarSun() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
      className="theme-sun pointer-events-none absolute bottom-3.5 left-1/2 size-6.5 -translate-x-1/2 text-background"
    >
      <circle cx="12" cy="12" r="4" />
      <path className="theme-sun-rays" d={RAY_PATH} />
    </svg>
  )
}

/**
 * Theme control: vertical sliding tabs for Light, Auto and Dark next to a
 * brightness bar. The bar is one `slider`; arrow keys step between the stops
 * and a press or drag on it picks the nearest one. Tabs and bar always agree
 * because both read and write the same stored preference.
 * @param props Component props.
 * @param props.copy Localised labels.
 * @returns The control.
 */
export default function ThemeSlider({ copy }: { copy: ThemeToggleCopy }) {
  const preference = useThemePreference()
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    readHydrated,
    readNotHydrated,
  )
  const barRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const index = THEME_STOPS.indexOf(preference)

  const pick = (clientY: number): void => {
    const box = barRef.current?.getBoundingClientRect()
    if (!box || box.height === 0) return
    const stop = THEME_STOPS[stopFromRatio((clientY - box.top) / box.height)]
    if (stop) chooseTheme(stop)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = stopAfterKey(index, event.key)
    if (next === null) return
    event.preventDefault()
    const stop = THEME_STOPS[next]
    if (stop) chooseTheme(stop)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    pick(event.clientY)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragging) pick(event.clientY)
  }

  const endDrag = (): void => {
    setDragging(false)
  }

  return (
    <div className="flex min-h-35 flex-1 gap-3 self-stretch">
      <div
        role="group"
        aria-label={copy.label}
        data-theme-tabs
        data-ready={hydrated ? '' : undefined}
        className="theme-tabs relative grid flex-1 grid-rows-3 bg-muted p-1"
      >
        <span
          aria-hidden="true"
          data-theme-indicator
          className="theme-indicator absolute inset-x-1 top-1 bg-foreground"
          data-ready={hydrated ? '' : undefined}
          data-stop={preference}
        />
        {THEME_STOPS.map((stop) => (
          <button
            key={stop}
            type="button"
            data-tab={stop}
            aria-pressed={stop === preference}
            onClick={() => {
              chooseTheme(stop)
            }}
            className={cn(
              'theme-tab relative z-10 flex min-h-11 flex-col items-center justify-center gap-2 px-3 text-center font-mono font-bold',
              stop === preference ? 'text-background' : 'text-muted-foreground',
            )}
          >
            <span className="size-5 shrink-0 [&>svg]:size-5">
              <StopIcon stop={stop} />
            </span>
            {copy[stop]}
          </button>
        ))}
      </div>
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label={copy.label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={THEME_STOPS.length - 1}
        aria-valuenow={index}
        aria-valuetext={copy[preference]}
        data-theme-slider
        data-ready={hydrated ? '' : undefined}
        data-dragging={dragging}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="theme-bar relative w-19 shrink-0 cursor-ns-resize touch-none overflow-hidden bg-muted"
        data-stop={preference}
      >
        <span
          aria-hidden="true"
          className="theme-fill absolute inset-x-0 bottom-0 bg-foreground"
        />
        <BarSun />
      </div>
    </div>
  )
}
