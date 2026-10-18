import { describe, expect, mock, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import chrome from '../content/chrome.json'
import type { Locale } from '../i18n/locales'
import Dock, { LanguageMenu, SoundSwitch, ThemeMenu } from './Dock'

function render(locale: Locale, path: string): string {
  return renderToStaticMarkup(
    <Dock
      copy={chrome[locale].dock}
      themeCopy={chrome[locale].theme}
      locale={locale}
      path={path}
    />,
  )
}

describe('Dock', () => {
  test('gives every control an accessible name in English', () => {
    const html = render('en', '/')
    for (const name of [
      'Home',
      'Products',
      'About',
      'Uses',
      'Find me',
      'Language',
      'Theme',
      'Sound',
    ]) {
      expect(html).toContain(`aria-label="${name}"`)
    }
    expect(html).toContain('aria-label="Main"')
  })

  test('uses the canvas dock geometry at every width', () => {
    const html = render('en', '/')
    expect(html).toContain('gap-1')
    expect(html).toContain('p-2')
    expect(html).not.toContain('sm:p-2')
    expect(html).toContain('data-dock-nav')
  })

  test('orders the items as the canvas does', () => {
    const html = render('en', '/')
    const names = [
      'Home',
      'About',
      'Products',
      'Uses',
      'Find me',
      'Language',
      'Theme',
      'Sound',
    ]
    const positions = names.map((name) => html.indexOf(`aria-label="${name}"`))
    expect(positions).toEqual(positions.toSorted((a, b) => a - b))
    expect(positions.every((position) => position >= 0)).toBe(true)
  })

  test('links Find me to the home anchor in each language', () => {
    expect(render('en', '/about/')).toContain('href="/#find-me"')
    expect(render('es', '/')).toContain('href="/es/#find-me"')
  })

  test('renders Sound off by default as a switch', () => {
    const html = render('en', '/')
    expect(html).toMatch(/role="switch"[^>]*aria-checked="false"/)
    expect(html).toContain('Sound off')
    expect(html).not.toContain('data-dock-sound-dot')
  })

  test('localises names and links in Spanish', () => {
    const html = render('es', '/about/')
    expect(html).toContain('aria-label="Inicio"')
    expect(html).toContain('aria-label="Idioma"')
    expect(html).toContain('href="/es/about/"')
    expect(html).toContain('href="/es/#products"')
  })

  test('marks only the current page and draws the pill on it', () => {
    const html = render('en', '/about/')
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html.match(/data-dock-pill/g)).toHaveLength(1)
    expect(html).toMatch(/href="\/about\/"[^>]*aria-current="page"/)
  })

  test('marks no page on a page the dock does not list', () => {
    expect(render('en', '/colophon/')).not.toContain('aria-current')
  })

  test('keeps both menus closed on first render', () => {
    const html = render('en', '/')
    expect(html).not.toContain('role="menu"')
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2)
    expect(html.match(/aria-haspopup="menu"/g)).toHaveLength(2)
  })
})

describe('LanguageMenu', () => {
  test('links the same page in each language and marks the current one', () => {
    const html = renderToStaticMarkup(
      <LanguageMenu
        copy={chrome.es.dock.language}
        locale="es"
        path="/about/"
      />,
    )
    expect(html).toContain('role="menu"')
    expect(html).toContain('href="/about/"')
    expect(html).toContain('href="/es/about/"')
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/href="\/es\/about\/"[^>]*aria-current/)
    expect(html).toContain('data-locale-switch="en"')
  })
})

describe('ThemeMenu', () => {
  test('offers auto, light and dark as radios with the stored one checked', () => {
    const html = renderToStaticMarkup(
      <ThemeMenu copy={chrome.en.theme} preference="dark" onChoose={mock()} />,
    )
    expect(html.match(/role="menuitemradio"/g)).toHaveLength(3)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-checked="true"[^>]*>Dark</)
  })
})

describe('SoundSwitch', () => {
  test('shows the dot, the checked state and the on tooltip when on', () => {
    const html = renderToStaticMarkup(
      <SoundSwitch copy={chrome.es.dock.sound} enabled onToggle={mock()} />,
    )
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('data-dock-sound-dot')
    expect(html).toContain('Sonido activado')
  })
})
