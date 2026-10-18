import { describe, expect, test } from 'bun:test'

import { FX_STORAGE_KEY, readFx, writeFx, type FxStorage } from './fx-store'

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
})
