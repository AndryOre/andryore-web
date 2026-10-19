import {
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import { soundEngine, type SoundEngine } from '@/lib/sound-engine'
import type { ThemePreference } from '@/lib/theme'
import {
  levelFromRatio,
  squeezeForLevel,
  stopAfterKey,
  stopFromLevel,
  stopFromRatio,
  THEME_STOPS,
} from '@/lib/theme-stops'
import { chooseTheme } from '@/lib/theme-store'
import { cn } from '@/lib/utils'

import { useThemePreference, type ThemeToggleCopy } from './ThemeToggle'

const unsubscribeNothing = (): void => undefined
const subscribeToNothing = (): (() => void) => unsubscribeNothing
const readHydrated = (): boolean => true
const readNotHydrated = (): boolean => false

const prefersReducedMotion = (): boolean =>
  typeof globalThis.matchMedia === 'function' &&
  globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches

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
 * Stores a stop picked with the bar or the keys and plays the theme sound when
 * it differs from the current one. The tabs name their sound in markup.
 * @param stop The picked stop, if any.
 * @param current The stop in force before the pick.
 * @param engine The sound engine to play through.
 * @param apply Stores the stop; defaults to the theme store.
 */
export function chooseWithSound(
  stop: ThemePreference | undefined,
  current: ThemePreference,
  engine: Pick<SoundEngine, 'play'> = soundEngine,
  apply: (stop: ThemePreference) => void = chooseTheme,
): void {
  if (!stop) return
  apply(stop)
  if (stop !== current) engine.play('theme')
}

/**
 * Theme control: vertical sliding tabs for Light, Auto and Dark next to a
 * brightness bar. The bar is one `slider`; arrow keys step between the stops
 * and a press or drag on it picks the nearest one. A press replayed after
 * hydration is untrusted: it picks a stop but starts no drag. A real drag only
 * moves the fill, through `--drag-level`, and the stop is stored on release.
 * Tabs and bar always agree because both read and write the same stored
 * preference.
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
  const replayedPressRef = useRef(false)
  const dragLevelRef = useRef(0)
  const index = THEME_STOPS.indexOf(preference)

  const choose = (stop: ThemePreference | undefined): void => {
    chooseWithSound(stop, preference)
  }

  const pick = (clientY: number): void => {
    const box = barRef.current?.getBoundingClientRect()
    if (!box || box.height === 0) return
    choose(THEME_STOPS[stopFromRatio((clientY - box.top) / box.height)])
  }

  const follow = (clientY: number): void => {
    const bar = barRef.current
    const box = bar?.getBoundingClientRect()
    if (!bar || !box || box.height === 0) return
    const banded = levelFromRatio((clientY - box.top) / box.height)
    const level = prefersReducedMotion()
      ? Math.min(100, Math.max(0, banded))
      : banded
    dragLevelRef.current = level
    bar.style.setProperty('--drag-level', String(level))
    bar.style.setProperty('--drag-squeeze', String(squeezeForLevel(level)))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = stopAfterKey(index, event.key)
    if (next === null) return
    event.preventDefault()
    choose(THEME_STOPS[next])
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.nativeEvent.isTrusted) {
      event.currentTarget.setPointerCapture(event.pointerId)
      follow(event.clientY)
      setDragging(true)
    } else {
      replayedPressRef.current = true
      pick(event.clientY)
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragging) {
      follow(event.clientY)
    } else if (replayedPressRef.current && event.buttons === 1) {
      pick(event.clientY)
    }
  }

  const endDrag = (): void => {
    replayedPressRef.current = false
    if (!dragging) return
    setDragging(false)
    const bar = barRef.current
    bar?.style.removeProperty('--drag-level')
    bar?.style.removeProperty('--drag-squeeze')
    choose(THEME_STOPS[stopFromLevel(dragLevelRef.current)])
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
            data-sound="theme"
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
          className="theme-fill absolute inset-0 bg-foreground"
        />
        <BarSun />
      </div>
    </div>
  )
}
