import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  chooseTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  paintTheme,
  subscribeToTheme,
} from './theme-store'

const globals = globalThis as unknown as Record<string, unknown>
const saved: Record<string, unknown> = {}
const STUBBED = ['document', 'matchMedia', 'localStorage'] as const

function stubBrowser(options: { storage: boolean; dark: boolean }) {
  const classes = new Set<string>()
  const stored = new Map<string, string>()
  globals.document = {
    documentElement: {
      classList: {
        add: (name: string) => classes.add(name),
        remove: (name: string) => classes.delete(name),
        toggle: (name: string, force: boolean) =>
          force ? classes.add(name) : classes.delete(name),
      },
    },
    querySelectorAll: () => [],
  }
  globals.matchMedia = () => ({ matches: options.dark })
  globals.localStorage = options.storage
    ? {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
        removeItem: (key: string) => stored.delete(key),
      }
    : {
        getItem: () => null,
        setItem: () => {
          throw new Error('blocked')
        },
        removeItem: () => {
          throw new Error('blocked')
        },
      }
  return { classes, stored }
}

beforeEach(() => {
  for (const name of STUBBED) saved[name] = globals[name]
})

afterEach(() => {
  for (const name of STUBBED) globals[name] = saved[name]
})

describe('theme store', () => {
  test('renders auto on the server', () => {
    expect(getServerThemeSnapshot()).toBe('auto')
  })

  test('paints the resolved theme, following the system for auto', () => {
    const { classes } = stubBrowser({ storage: true, dark: true })
    paintTheme('auto')
    expect(classes.has('dark')).toBe(true)
    paintTheme('light')
    expect(classes.has('dark')).toBe(false)
  })

  test('stores the choice, paints it and notifies subscribers', () => {
    const { classes, stored } = stubBrowser({ storage: true, dark: false })
    let notified = 0
    const unsubscribe = subscribeToTheme(() => {
      notified += 1
    })
    chooseTheme('dark')
    expect(classes.has('dark')).toBe(true)
    expect(classes.has('theme-fade')).toBe(true)
    expect(stored.get('theme')).toBe('dark')
    expect(getThemeSnapshot()).toBe('dark')
    expect(notified).toBe(1)
    unsubscribe()
    chooseTheme('auto')
    expect(notified).toBe(1)
    expect(getThemeSnapshot()).toBe('auto')
  })

  test('keeps the choice in memory when storage is blocked', () => {
    stubBrowser({ storage: false, dark: false })
    chooseTheme('light')
    expect(getThemeSnapshot()).toBe('light')
    stubBrowser({ storage: true, dark: false })
    chooseTheme('auto')
    expect(getThemeSnapshot()).toBe('auto')
  })
})
