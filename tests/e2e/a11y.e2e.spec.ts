import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { href, locales, routes, type RouteKey } from '../../src/i18n/config'

/** Spec §9 Aksesibilitas: WCAG 2.1 AA, checked automatically with axe on every page in both languages. */
const BASE = 'http://localhost:3000'
const PAGES = (Object.keys(routes) as RouteKey[]).flatMap((key) =>
  locales.map((locale) => ({ key, locale, path: href(key, locale) })),
)

test.describe('WCAG 2.1 AA (axe)', () => {
  // Blocks entering at the bottom of the screen are mid fade-in by design; check the resting colours.
  test.use({ reducedMotion: 'reduce' })
  for (const p of PAGES) {
    test(`${p.locale.toUpperCase()} ${p.key}`, async ({ page }) => {
      await page.goto(BASE + p.path)
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Third-party map iframe content is outside our control.
        .exclude('iframe')
        .analyze()
      const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.help}\n    ${v.nodes[0]?.target.join(' ')}`)
      expect(summary).toEqual([])
    })
  }
})

test.describe('Keyboard', () => {
  test('skip link is the first stop and moves focus to the content', async ({ page }) => {
    await page.goto(BASE)
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    // Not covered by the fixed header (WCAG 2.4.11).
    const onTop = await skip.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))
    })
    expect(onTop).toBe(true)
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('focused links and buttons show a visible focus ring', async ({ page }) => {
    await page.goto(BASE)
    const missing: string[] = []
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const s = getComputedStyle(el)
        const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'
        return { ring, label: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}"` }
      })
      if (info && !info.ring) missing.push(info.label)
    }
    expect(missing).toEqual([])
  })
})
