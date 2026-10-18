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
      await expect(tile.locator('[data-stream-panel="live"]')).toContainText(
        copy.live,
      )
      await expect(tile.locator('[data-stream-title]')).toHaveText(
        'Building the site',
      )
      await expect(tile.locator('[data-stream-panel="offline"]')).toBeHidden()
    })

    test('shows the offline panel when the channel is offline', async ({
      page,
    }) => {
      await page.route('**/api/stream-status', (handler) =>
        handler.fulfill({ json: { state: 'offline' } }),
      )
      await page.goto(route)
      await settlePage(page)
      const panel = page.locator('[data-stream-panel="offline"]')
      await expect(panel).toBeVisible()
      await expect(panel).toContainText(copy.offline)
    })

    test('falls back to unavailable when the endpoint fails', async ({
      page,
    }) => {
      await page.route('**/api/stream-status', (handler) =>
        handler.fulfill({ status: 500, body: 'upstream error' }),
      )
      await page.goto(route)
      await settlePage(page)
      const panel = page.locator('[data-stream-panel="unavailable"]')
      await expect(panel).toBeVisible()
      await expect(panel).toHaveText(copy.unavailable)
    })
  })
}
