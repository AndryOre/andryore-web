import { expect, test } from '@playwright/test'

import { preparePage, settlePage } from './helpers'
import { ROUTES, THEMES, VIEWPORTS } from './routes'

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      test(`${route} at ${name} (${theme})`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await preparePage(page, theme)
        await page.goto(route)
        await settlePage(page)
        await expect(page).toHaveScreenshot(
          `${route.replaceAll('/', '_')}-${name}-${theme}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.002 },
        )
      })
    }
  }
}
