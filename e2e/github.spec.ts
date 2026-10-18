import { expect, test } from '@playwright/test'

import { settlePage } from './helpers'
import { languageOf } from './messages'

const HOME_ROUTES = ['/', '/es/'] as const

const liveGrid = {
  capturedAt: '2026-10-18',
  updatedAt: new Date().toISOString(),
  total: 4321,
  weeks: [
    [
      { date: '2026-10-15', count: 0, level: 0 },
      { date: '2026-10-16', count: 3, level: 2 },
      { date: '2026-10-17', count: 9, level: 4 },
      { date: '2026-10-18', count: 1, level: 1 },
    ],
  ],
}

for (const route of HOME_ROUTES) {
  const language = languageOf(route)

  test.describe(`github tile on ${route}`, () => {
    test('renders the live grid and stats from the endpoint', async ({
      page,
    }) => {
      await page.route('**/api/github-contributions', (handler) =>
        handler.fulfill({ json: liveGrid }),
      )
      await page.goto(route)
      await settlePage(page)
      const tile = page.locator('[data-github-grid]')
      await expect(tile.locator('[data-gh-grid] i')).toHaveCount(4)
      await expect(tile.locator('[data-gh-grid] i').first()).toHaveAttribute(
        'data-tip',
        language === 'es' ? /contribuci/ : /contribution/,
      )
      await expect(tile.locator('[data-gh-stat="best"]')).toHaveText('9')
      await expect(tile.locator('[data-gh-stat="longest"]')).toHaveText('3')
      await expect(tile.locator('[data-gh-stat="longest-unit"]')).toHaveText(
        language === 'es' ? 'días' : 'days',
      )
      await expect(tile.locator('[data-count-total]')).toHaveText(
        language === 'es' ? '4.321' : '4,321',
      )
      await expect(tile.locator('[data-gh-updated]')).toHaveText(
        language === 'es' ? /^Actualizado / : /^Updated /,
      )
    })

    test('keeps the build snapshot when the endpoint fails', async ({
      page,
    }) => {
      await page.route('**/api/github-contributions', (handler) =>
        handler.fulfill({ status: 503, body: 'unavailable' }),
      )
      await page.goto(route)
      await settlePage(page)
      const tile = page.locator('[data-github-grid]')
      await expect(tile).toBeVisible()
      expect(await tile.locator('[data-gh-grid] i').count()).toBeGreaterThan(50)
      await expect(tile.locator('[data-gh-updated]')).toHaveText(
        language === 'es' ? /^Actualizado / : /^Updated /,
      )
    })
  })
}
