import { describe, expect, mock, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import chrome from '../content/chrome.json'
import type { Locale } from '../i18n/locales'
import Dock, { LanguageMenu, ThemeMenu } from './Dock'

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
      'Log',
      'About',
      'Uses',
      'EN Language',
      'Theme',
    ]) {
      expect(html).toContain(`aria-label="${name}"`)
    }
    expect(html).toContain('aria-label="Main"')
  })

  test('localises names and links in Spanish', () => {
    const html = render('es', '/log/')
    expect(html).toContain('aria-label="Inicio"')
    expect(html).toContain('aria-label="ES Idioma"')
    expect(html).toContain('href="/es/log/"')
    expect(html).toContain('href="/es/#products"')
  })

  test('marks only the current page and draws the pill on it', () => {
    const html = render('en', '/log/first-entry/')
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html.match(/data-dock-pill/g)).toHaveLength(1)
    expect(html).toMatch(/href="\/log\/"[^>]*aria-current="page"/)
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
        path="/log/first-entry/"
      />,
    )
    expect(html).toContain('role="menu"')
    expect(html).toContain('href="/log/first-entry/"')
    expect(html).toContain('href="/es/log/first-entry/"')
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/href="\/es\/log\/first-entry\/"[^>]*aria-current/)
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
