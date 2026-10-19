import { expect, test } from '@playwright/test'

import {
  assertNoHorizontalOverflow,
  findClippedText,
  findDockOutsideViewport,
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

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`header gets a surface after scrolling with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion })
    await page.route('**/api/stream-status', (handler) =>
      handler.fulfill({ json: { state: 'offline' } }),
    )
    await page.goto('/')
    const header = page.locator('.site-header')
    const background = () =>
      header.evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(await background()).toBe('rgba(0, 0, 0, 0)')
    await page.evaluate(() => {
      globalThis.scrollTo(0, 400)
    })
    await expect
      .poll(background)
      .not.toMatch(/^rgba\(0, 0, 0, 0\)$|^transparent$/)
  })
}

const DOCK_WIDTHS = [320, 360, 375, 390, 412, 430] as const

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  for (const width of DOCK_WIDTHS) {
    test(`dock fits the viewport at ${String(width)} px with ${reducedMotion} motion`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 })
      await preparePage(page, 'light')
      await page.emulateMedia({ reducedMotion })
      await page.goto('/')
      await settlePage(page)
      expect(await findDockOutsideViewport(page)).toEqual([])
      for (const trigger of ['language', 'theme']) {
        await page.locator(`[data-dock-trigger="${trigger}"]`).click()
        await expect(page.locator('[data-dock-panel]')).toBeVisible()
        expect(await findDockOutsideViewport(page)).toEqual([])
        await page.keyboard.press('Escape')
      }
    })
  }
}
