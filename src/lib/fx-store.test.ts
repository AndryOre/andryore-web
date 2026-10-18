import { describe, expect, test } from 'bun:test'

import {
  FX_STORAGE_KEY,
  readFx,
  subscribeFx,
  writeFx,
  type FxStorage,
} from './fx-store'

const fakeStorage = (): FxStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

const brokenStorage: FxStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('subscribeFx', () => {
  test('notifies on writes until unsubscribed', () => {
    const listeners = new Set<() => void>()
    const stubs = {
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
      dispatchEvent: () => {
        for (const listener of listeners) listener()
        return true
      },
    }
    const previous = Object.fromEntries(
      Object.keys(stubs)
        .filter((key) => Object.hasOwn(globalThis, key))
        .map((key) => [key, Reflect.get(globalThis, key) as unknown]),
    )
    Object.assign(globalThis, stubs)
    try {
      let calls = 0
      const unsubscribe = subscribeFx(() => {
        calls += 1
      })
      writeFx(undefined, true)
      expect(calls).toBe(1)
      unsubscribe()
      writeFx(undefined, false)
      expect(calls).toBe(1)
    } finally {
      Object.assign(globalThis, previous)
      for (const key of Object.keys(stubs)) {
        if (!Object.hasOwn(previous, key)) {
          Reflect.deleteProperty(globalThis, key)
        }
      }
    }
  })
})

describe('fx store', () => {
  test('defaults to off', () => {
    expect(readFx(fakeStorage())).toBe(false)
  })

  test('round-trips through storage under ao-fx2', () => {
    const storage = fakeStorage()
    writeFx(storage, true)
    expect(storage.values.get(FX_STORAGE_KEY)).toBe('on')
    expect(readFx(storage)).toBe(true)
    writeFx(storage, false)
    expect(readFx(storage)).toBe(false)
  })

  test('ignores unknown stored values', () => {
    const storage = fakeStorage()
    storage.setItem(FX_STORAGE_KEY, 'maybe')
    expect(readFx(storage)).toBe(false)
  })

  test('falls back to memory when storage throws', () => {
    writeFx(brokenStorage, true)
    expect(readFx(brokenStorage)).toBe(true)
    expect(readFx(undefined)).toBe(true)
    writeFx(undefined, false)
    expect(readFx(undefined)).toBe(false)
  })

  test('keeps the new choice when only the write fails', () => {
    const readOnly: FxStorage = {
      getItem: () => 'off',
      setItem: () => {
        throw new Error('quota')
      },
    }
    writeFx(readOnly, true)
    expect(readFx(readOnly)).toBe(true)
    writeFx(fakeStorage(), false)
    expect(readFx(readOnly)).toBe(false)
  })
})
