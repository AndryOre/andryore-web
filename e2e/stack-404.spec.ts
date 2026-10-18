import { expect, test } from '@playwright/test'

import { preparePage, settlePage } from './helpers'

const NOT_FOUND_PAGES = [
  {
    path: '/does-not-exist/',
    heading: /wandered off/,
    message: /It is not here/,
    home: '/',
    products: '/#products',
  },
  {
    path: '/es/404/',
    heading: /se fue por ahí/,
    message: /No está aquí/,
    home: '/es/',
    products: '/es/#products',
  },
] as const

for (const page of NOT_FOUND_PAGES) {
  test(`${page.path} renders the 404 with working Home and Products links`, async ({
    page: browserPage,
  }) => {
    await preparePage(browserPage, 'light')
    await browserPage.goto(page.path)
    await expect(
      browserPage.getByRole('heading', { level: 1, name: page.heading }),
    ).toBeVisible()
    await expect(browserPage.getByText(page.message)).toBeVisible()
    const links = browserPage.locator('.nf-stage a')
    await expect(links).toHaveCount(2)
    await expect(links.nth(0)).toHaveAttribute('href', page.home)
    await expect(links.nth(1)).toHaveAttribute('href', page.products)
    await links.nth(0).click()
    await expect(browserPage).toHaveURL(new RegExp(`${page.home}$`))
  })
}

test('with reduced motion the Stack CTA is visible without scrolling the stage', async ({
  page,
}) => {
  await preparePage(page, 'dark')
  await page.goto('/')
  await settlePage(page)
  const link = page.locator('.stack-cta-link')
  await link.scrollIntoViewIfNeeded()
  await expect(link).toBeVisible()
  await expect(page.locator('.stack-cta')).toHaveCSS('opacity', '1')
  await expect(link).toHaveAttribute('href', '/uses/')
  await expect(
    page.locator('.stack-tile[aria-hidden="true"]').first(),
  ).toBeAttached()
  await expect(page.locator('.stack-scene a')).toHaveCount(1)
  await expect(page.locator('.stack-stage')).toHaveCSS('height', '760px')
  await expect(page.locator('.stack-scene')).not.toHaveCSS('height', '2000px')
  await expect(page.locator('.stack-tile-scatter').first()).toHaveCSS(
    'rotate',
    '-8deg',
  )
  await expect(page.locator('.stack-title')).toHaveCSS('opacity', '1')
})

for (const route of ['/does-not-exist/', '/es/404/']) {
  test(`${route} keeps the 12 tiles at their canvas spots and off the content at 390px`, async ({
    page,
  }) => {
    await preparePage(page, 'light')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(route)
    await settlePage(page)
    await expect(page.locator('.nf-tile')).toHaveCount(12)
    await expect(page.locator('.nf-tile').first()).toHaveCSS('left', /^28\./)
    await expect(page.locator('.nf-stage')).toHaveCSS('height', '560px')
    await expect(page.locator('.nf-title')).toHaveCSS('font-size', '30px')

    const layout = await page.evaluate(() => {
      const [primary, secondary] = [
        ...globalThis.document.querySelectorAll('.nf-button'),
      ].map((element) => element.getBoundingClientRect())
      const title = globalThis.document
        .querySelector('.nf-title')
        ?.getBoundingClientRect()
      return {
        sideBySide: primary?.top === secondary?.top,
        titleHeight: title?.height,
      }
    })
    expect(layout.sideBySide).toBe(true)
    expect(layout.titleHeight).toBeLessThan(40)
    await expect(page.locator('.nf-tile').first()).toHaveCSS('z-index', '0')
    for (const selector of [
      '.nf-code',
      '.nf-title',
      '.nf-message',
      '.nf-actions',
    ])
      await expect(page.locator(selector)).toHaveCSS('z-index', '2')
    const covered = await page.evaluate(() => {
      const doc = globalThis.document
      return [
        ...doc.querySelectorAll('h1'),
        ...doc.querySelectorAll('p'),
        ...doc.querySelectorAll('.nf-button'),
        ...doc
          .querySelectorAll('.nf-code')
          .values()
          .flatMap((code) => code.querySelectorAll(':scope > span')),
      ]
        .map((element) => {
          const rect = element.getBoundingClientRect()
          const top = doc.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          )
          return element.contains(top)
        })
        .every(Boolean)
    })
    expect(covered).toBe(true)
  })
}
