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
    heading: /se fue por su cuenta/,
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
})
