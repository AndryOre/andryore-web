import { expect, test } from '@playwright/test'

import { preparePage, settlePage } from './helpers'

const ENGLISH_CV = '/cv/andry-orellana-cv-en.pdf'
const SPANISH_CV = '/cv/andry-orellana-cv-es.pdf'

test.describe('about CV split button', () => {
  test('lists both PDFs and keeps the chosen language after a reload', async ({
    page,
  }) => {
    await preparePage(page, 'light')
    await page.goto('/about/')
    await settlePage(page)
    const download = page.locator('[data-cv-download]')
    await expect(download).toHaveAttribute('href', ENGLISH_CV)

    await page.locator('[data-cv-menu-trigger]').click()
    const english = page.getByRole('menuitemradio', { name: 'English (PDF)' })
    const spanish = page.getByRole('menuitemradio', { name: 'Spanish (PDF)' })
    await expect(english).toBeVisible()
    await expect(spanish).toBeVisible()

    await spanish.click()
    await expect(download).toHaveAttribute('href', SPANISH_CV)

    await page.reload()
    await settlePage(page)
    await expect(download).toHaveAttribute('href', SPANISH_CV)
  })

  test('the Spanish page starts with the Spanish CV', async ({ page }) => {
    await preparePage(page, 'light')
    await page.goto('/es/about/')
    await settlePage(page)
    await expect(page.locator('[data-cv-download]')).toHaveAttribute(
      'href',
      SPANISH_CV,
    )
  })
})
