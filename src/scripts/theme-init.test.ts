import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import astroConfig from '../../astro.config.mjs'
import {
  applyResolvedTheme,
  resolveTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from '../lib/theme'
import {
  scriptHash,
  THEME_INIT_SCRIPT,
  THEME_INIT_SCRIPT_HASH,
} from './theme-init'

type Listener = () => void

const THROWS = '<throws>'

function createFakePage(options: {
  stored: string | null
  systemDark: boolean
}) {
  const classes = new Set<string>()
  const metas = ['light', 'dark'].map((themeColor) => ({
    media: `(prefers-color-scheme: ${themeColor})`,
    dataset: { themeColor },
  }))
  const state = { stored: options.stored, systemDark: options.systemDark }
  const queryListeners: Listener[] = []
  const windowListeners = new Map<string, Listener>()

  const document = {
    documentElement: {
      classList: {
        toggle: (name: string, force: boolean) =>
          force ? classes.add(name) : classes.delete(name),
      },
    },
    querySelectorAll: () => metas,
  }
  const query = {
    get matches() {
      return state.systemDark
    },
    addEventListener: (_type: string, listener: Listener) => {
      queryListeners.push(listener)
    },
  }
  const localStorage = {
    getItem: () => {
      if (state.stored === THROWS) throw new Error('blocked')
      return state.stored
    },
  }

  runInNewContext(THEME_INIT_SCRIPT, {
    document,
    matchMedia: () => query,
    localStorage,
    addEventListener: (type: string, listener: Listener) => {
      windowListeners.set(type, listener)
    },
  })

  return {
    isDark: () => classes.has('dark'),
    metaMedia: () => metas.map((meta) => meta.media),
    changeSystem: (systemDark: boolean) => {
      state.systemDark = systemDark
      for (const listener of queryListeners) listener()
    },
    changeStored: (stored: string | null) => {
      state.stored = stored
      windowListeners.get('storage')?.()
    },
    document,
  }
}

describe('theme init script', () => {
  test('defaults to auto: follows the system with nothing stored', () => {
    expect(createFakePage({ stored: null, systemDark: true }).isDark()).toBe(
      true,
    )
    expect(createFakePage({ stored: null, systemDark: false }).isDark()).toBe(
      false,
    )
  })

  test('a stored light or dark overrides the system', () => {
    expect(createFakePage({ stored: 'light', systemDark: true }).isDark()).toBe(
      false,
    )
    expect(createFakePage({ stored: 'dark', systemDark: false }).isDark()).toBe(
      true,
    )
  })

  test('an invalid stored value falls back to auto', () => {
    expect(createFakePage({ stored: 'sepia', systemDark: true }).isDark()).toBe(
      true,
    )
  })

  test('storage that throws falls back to auto', () => {
    expect(createFakePage({ stored: THROWS, systemDark: true }).isDark()).toBe(
      true,
    )
  })

  test('auto follows a system change without a reload', () => {
    const page = createFakePage({ stored: null, systemDark: false })
    page.changeSystem(true)
    expect(page.isDark()).toBe(true)
  })

  test('an explicit choice ignores a system change', () => {
    const page = createFakePage({ stored: 'light', systemDark: false })
    page.changeSystem(true)
    expect(page.isDark()).toBe(false)
  })

  test('re-applies when another tab changes the stored choice', () => {
    const page = createFakePage({ stored: null, systemDark: false })
    page.changeStored('dark')
    expect(page.isDark()).toBe(true)
  })

  test('keeps only the matching theme-color meta active', () => {
    const page = createFakePage({ stored: 'dark', systemDark: false })
    expect(page.metaMedia()).toEqual(['not all', 'all'])
  })

  test('matches src/lib/theme for every preference and system scheme', () => {
    const stored: Record<ThemePreference, string | null> = {
      auto: null,
      light: 'light',
      dark: 'dark',
    }
    for (const preference of THEME_PREFERENCES) {
      for (const systemDark of [true, false]) {
        const page = createFakePage({ stored: stored[preference], systemDark })
        const reference = createFakePage({ stored: null, systemDark: false })
        applyResolvedTheme(
          reference.document,
          resolveTheme(preference, systemDark),
        )
        expect({ preference, systemDark, media: page.metaMedia() }).toEqual({
          preference,
          systemDark,
          media: reference.metaMedia(),
        })
        expect(page.isDark()).toBe(
          resolveTheme(preference, systemDark) === 'dark',
        )
      }
    }
  })
})

describe('theme init script hash', () => {
  test('is the sha256 of the exact source, base64 encoded', () => {
    expect(THEME_INIT_SCRIPT_HASH).toBe(scriptHash(THEME_INIT_SCRIPT))
    expect(THEME_INIT_SCRIPT_HASH).toMatch(/^sha256-[A-Za-z0-9+/]{43}=$/)
  })

  test('changes when the source changes', () => {
    expect(scriptHash(`${THEME_INIT_SCRIPT};`)).not.toBe(THEME_INIT_SCRIPT_HASH)
  })

  test('is allowed by the Astro CSP script-src', () => {
    const hashes = astroConfig.security?.csp
    expect(hashes).toBeObject()
    expect(JSON.stringify(hashes)).toContain(THEME_INIT_SCRIPT_HASH)
  })

  test('is the script the base layout inlines', () => {
    const layout = readFileSync(
      new URL('../layouts/BaseLayout.astro', import.meta.url),
      'utf8',
    )
    expect(layout).toContain('<script is:inline set:html={THEME_INIT_SCRIPT}')
  })

  test('uses no eval-like constructs', () => {
    expect(THEME_INIT_SCRIPT).not.toMatch(/\beval\b|new Function|innerHTML/)
  })
})
