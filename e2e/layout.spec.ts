import { expect, test } from '@playwright/test'

import {
  assertNoHorizontalOverflow,
  findClippedText,
  findSmallTouchTargets,
  preparePage,
  settlePage,
} from './helpers'
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

for (const route of ROUTES) {
  test(`touch targets and text fit on ${route} at phone width`, async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.phone)
    await preparePage(page, 'light')
    await page.goto(route)
    await settlePage(page)
    expect(await findSmallTouchTargets(page)).toEqual([])
    expect(await findClippedText(page)).toEqual([])
  })
}
