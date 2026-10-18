import { describe, expect, test } from 'bun:test'

import type { FxStorage } from '../lib/fx-store'
import { mountFxSwitch, type FxSwitchElement } from './fx-tile'

const noop = (): undefined => undefined

const createSwitch = () => {
  const attributes = new Map<string, string>()
  let click: () => void = noop
  const element: FxSwitchElement = {
    setAttribute: (name, value) => {
      attributes.set(name, value)
    },
    addEventListener: (_type, listener) => {
      click = listener
    },
  }
  return {
    element,
    attributes,
    press: () => {
      click()
    },
  }
}

const createStorage = (): FxStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('mountFxSwitch', () => {
  test('starts off and toggles with persistence', () => {
    const { element, attributes, press } = createSwitch()
    const storage = createStorage()
    mountFxSwitch(element, storage)
    expect(attributes.get('aria-checked')).toBe('false')
    press()
    expect(attributes.get('aria-checked')).toBe('true')
    expect(storage.values.get('ao-fx2')).toBe('on')
    press()
    expect(attributes.get('aria-checked')).toBe('false')
  })

  test('restores the stored choice', () => {
    const storage = createStorage()
    storage.setItem('ao-fx2', 'on')
    const { element, attributes } = createSwitch()
    mountFxSwitch(element, storage)
    expect(attributes.get('aria-checked')).toBe('true')
  })
})
