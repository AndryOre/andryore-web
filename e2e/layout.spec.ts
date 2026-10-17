import { test } from '@playwright/test'

import { assertNoHorizontalOverflow, preparePage, settlePage } from './helpers'
import { ROUTES, VIEWPORTS } from './routes'

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route} at ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await preparePage(page, 'light')
      await page.goto(route)
      await settlePage(page)
      await assertNoHorizontalOverflow(page)
    })
  }
}
