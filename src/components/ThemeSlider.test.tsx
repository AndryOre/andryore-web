import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import chrome from '../content/chrome.json'
import type { Locale } from '../i18n/locales'
import ThemeSlider from './ThemeSlider'

const render = (locale: Locale): string =>
  renderToStaticMarkup(<ThemeSlider copy={chrome[locale].theme} />)

describe('ThemeSlider', () => {
  test('exposes the bar as a vertical slider over the three stops', () => {
    const html = render('en')
    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-orientation="vertical"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="2"')
    expect(html).toContain('aria-valuetext="Auto"')
    expect(html).toContain('tabindex="0"')
  })

  test('lists the tabs as Light, Auto, Dark with the current one pressed', () => {
    const html = render('en')
    const positions = ['Light', 'Auto', 'Dark'].map((name) =>
      html.indexOf(`</span>${name}</button>`),
    )
    expect(positions.every((position) => position > -1)).toBe(true)
    expect(positions).toEqual(positions.toSorted((a, b) => a - b))
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
  })

  test('stacks each tab icon above its centred label', () => {
    const html = render('en')
    expect(html).toContain('flex-col items-center justify-center')
    expect(html).toContain('text-center font-mono font-bold')
    expect(html).toContain('min-h-35')
  })

  test('marks the indicator and the bar with the stored stop, never inline style', () => {
    const html = render('en')
    expect(html.match(/data-stop="auto"/g)).toHaveLength(2)
    expect(html).not.toContain('style=')
  })

  test('keeps decorative icons out of the accessibility tree', () => {
    const html = render('en')
    expect(html.match(/<svg[^>]*aria-hidden="true"/g)).toHaveLength(4)
  })

  test('translates the labels', () => {
    const html = render('es')
    expect(html).toContain(`aria-label="${chrome.es.theme.label}"`)
    expect(html).toContain(chrome.es.theme.dark)
  })
})
