import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import about from '../content/about.json'
import type { Locale } from '../i18n/locales'
import { CV_PATHS } from '../lib/contact'
import CvSplitButton from './CvSplitButton'

const render = (locale: Locale): string =>
  renderToStaticMarkup(<CvSplitButton locale={locale} copy={about[locale]} />)

describe('CvSplitButton', () => {
  test('downloads the page language by default', () => {
    expect(render('en')).toContain(`href="${CV_PATHS.en}"`)
    expect(render('es')).toContain(`href="${CV_PATHS.es}"`)
  })

  test('names the file and the language for assistive technology', () => {
    const html = render('en')
    expect(html).toContain(`download="${about.en.cvEnglishFile}"`)
    expect(html).toContain(about.en.cvEnglishOption)
    expect(html).toContain(`aria-label="${about.en.cvMenuLabel}"`)
    expect(render('es')).toContain(`aria-label="${about.es.cvMenuLabel}"`)
  })

  test('tracks the download by language', () => {
    expect(render('es')).toContain('data-umami-event-language="es"')
  })
})
