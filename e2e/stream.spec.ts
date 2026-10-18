import { expect, test } from '@playwright/test'

import { settlePage } from './helpers'
import { languageOf, streamMessages } from './messages'

const HOME_ROUTES = ['/', '/es/'] as const

for (const route of HOME_ROUTES) {
  const copy = streamMessages(languageOf(route))

  test.describe(`stream tile on ${route}`, () => {
    test('shows the live panel with the stream title', async ({ page }) => {
      await page.route('**/api/stream-status', (handler) =>
        handler.fulfill({
          json: { state: 'live', title: 'Building the site' },
        }),
      )
      await page.goto(route)
      await settlePage(page)
      const tile = page.locator('[data-stream-tile]')
      await expect(tile.locator('[data-stream-panel="live"]')).toBeVisible()
      await expect(tile.locator('[data-stream-live-tag]')).toHaveText(
        copy.liveTag,
      )
      await expect(tile.locator('[data-stream-panel="live"]')).toContainText(
        copy.watch,
      )
      await expect(tile.locator('[data-stream-title]')).toHaveText(
        'Building the site',
      )
      await expect(
        tile.locator('[data-stream-panel="coming-soon"]'),
      ).toBeHidden()
    })

    test('shows the coming-soon slate when the channel is offline', async ({
      page,
    }) => {
      await page.route('**/api/stream-status', (handler) =>
        handler.fulfill({ json: { state: 'offline' } }),
      )
      await page.goto(route)
      await settlePage(page)
      const panel = page.locator('[data-stream-panel="coming-soon"]')
      await expect(panel).toBeVisible()
      await expect(panel).toContainText(copy.comingSoon)
      await expect(panel).toContainText(copy.planned)
    })

    test('keeps the coming-soon slate when the endpoint fails', async ({
      page,
    }) => {
      await page.route('**/api/stream-status', (handler) =>
        handler.fulfill({ status: 500, body: 'upstream error' }),
      )
      await page.goto(route)
      await settlePage(page)
      const panel = page.locator('[data-stream-panel="coming-soon"]')
      await expect(panel).toBeVisible()
      await expect(panel).toContainText(copy.comingSoon)
    })
  })
}
