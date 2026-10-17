import { expect, type Page } from '@playwright/test'

import type { Theme } from './routes'

const THEME_STORAGE_KEY = 'theme'

/**
 * Pins the theme before any page script runs, forces reduced motion and
 * answers the stream status endpoint that only nginx serves in production.
 * @param page The page to configure.
 * @param theme The theme to paint.
 */
export async function preparePage(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  await page.route('**/api/stream-status', (route) =>
    route.fulfill({ json: { state: 'offline' } }),
  )
  await page.addInitScript(
    ([key, value]) => {
      globalThis.localStorage.setItem(key, value)
    },
    [THEME_STORAGE_KEY, theme] as const,
  )
}

/**
 * Brings the page to a stable state: islands hydrated, lazy images loaded,
 * fonts and network settled, no CSS transition left running.
 * @param page The page to settle.
 */
export async function settlePage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(globalThis.innerHeight, 1)
    for (
      let top = 0;
      top < globalThis.document.documentElement.scrollHeight;
      top += step
    ) {
      globalThis.scrollTo(0, top)
      await new Promise((resolve) => globalThis.requestAnimationFrame(resolve))
    }
    globalThis.scrollTo(0, 0)
    for (const island of globalThis.document.querySelectorAll(
      'astro-island[ssr]',
    )) {
      island.dispatchEvent(new globalThis.FocusEvent('focusin'))
    }
    for (const image of globalThis.document.querySelectorAll(
      'img[loading="lazy"]',
    )) {
      image.setAttribute('loading', 'eager')
    }
  })
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await globalThis.document.fonts.ready
    for (const image of globalThis.document.images) {
      try {
        await image.decode()
      } catch {
        continue
      }
    }
  })
  const reducesMotion = await page.evaluate(
    () => globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  if (reducesMotion) {
    await expect
      .poll(() =>
        page.evaluate(() => globalThis.document.getAnimations().length),
      )
      .toBe(0)
  }
}

/**
 * Asserts the page has no horizontal scrollbar.
 * @param page The page to measure.
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth -
      globalThis.document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

const MINIMUM_TOUCH_TARGET = 43.5

/**
 * Lists the standalone controls smaller than the touch target minimum. Links
 * inside running text are exempt, as in WCAG 2.5.8.
 * @param page The page to measure.
 * @returns A description of each control that is too small.
 */
export async function findSmallTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate((minimum) => {
    const small: string[] = []
    const controls = globalThis.document.querySelectorAll<HTMLElement>(
      'a[href], button, [role="button"], summary',
    )
    for (const control of controls) {
      const inline = control.closest('p, li, dd, blockquote')
      const bounds = control.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) continue
      if (inline && !control.closest('nav, footer')) continue
      if (control.closest('.sr-only, [hidden], [aria-hidden="true"]')) continue
      if (bounds.width < minimum || bounds.height < minimum) {
        small.push(
          `${control.tagName.toLowerCase()} "${control.textContent.trim().slice(0, 30)}" ${String(Math.round(bounds.width))}x${String(Math.round(bounds.height))}`,
        )
      }
    }
    return small
  }, MINIMUM_TOUCH_TARGET)
}

/**
 * Lists the elements whose text is cut off by their own box.
 * @param page The page to measure.
 * @returns A description of each element that clips its content.
 */
export async function findClippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const clipped: string[] = []
    const candidates = globalThis.document.querySelectorAll<HTMLElement>(
      'h1, h2, h3, p, a, button, li, span, dt, dd',
    )
    for (const element of candidates) {
      const style = globalThis.getComputedStyle(element)
      const hides = style.overflowX === 'hidden' || style.overflowX === 'clip'
      if (hides && element.scrollWidth > element.clientWidth + 1) {
        clipped.push(
          `${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 30)}"`,
        )
      }
    }
    return clipped
  })
}
