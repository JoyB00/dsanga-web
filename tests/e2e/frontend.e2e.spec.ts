import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { href, locales, routes, type Locale, type RouteKey } from '../../src/i18n/config'

const BASE = 'http://localhost:3000'
const PAGES = (Object.keys(routes) as RouteKey[]).flatMap((key) =>
  locales.map((locale) => ({ key, locale, path: href(key, locale) })),
)
const other = (locale: Locale): Locale => (locale === 'en' ? 'id' : 'en')
const samePath = (a: string, b: string) => a.replace(/\/$/, '') === b.replace(/\/$/, '')

test.describe('Every page, both languages (spec §3.1, F-08, §9 SEO)', () => {
  for (const p of PAGES) {
    test(`${p.locale.toUpperCase()} ${p.key} → ${p.path}`, async ({ page }) => {
      const res = await page.goto(BASE + p.path)
      expect(res?.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', p.locale)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page).toHaveTitle(/D’Sanga/)
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy()

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
      expect(samePath(new URL(canonical!).pathname, p.path)).toBe(true)
      for (const lang of ['en', 'id', 'x-default']) {
        const alt = await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute('href')
        const expected = href(p.key, lang === 'id' ? 'id' : 'en')
        expect(samePath(new URL(alt!).pathname, expected), `hreflang ${lang}`).toBe(true)
      }

      // Language switcher points to the same page in the other language (spec §3.2).
      const target = other(p.locale)
      await expect(page.locator(`header a[hreflang="${target}"]`)).toHaveAttribute('href', href(p.key, target))
    })
  }
})

test.describe('Routing', () => {
  test('Indonesian slugs map to the same page and English slugs redirect', async ({ page }) => {
    await page.goto(`${BASE}/id/dining`)
    await expect(page).toHaveURL(/\/id\/bistro-coffee$/)
    await page.goto(`${BASE}/en/pool`)
    await expect(page).toHaveURL(/\/pool$/)
  })

  test('unknown pages return 404', async ({ page }) => {
    expect((await page.goto(`${BASE}/does-not-exist`))?.status()).toBe(404)
  })

  test('a visitor who chose Indonesian lands on /id from the home page', async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'id', url: BASE }])
    await page.goto(BASE)
    await expect(page).toHaveURL(`${BASE}/id`)
  })

  test('the language switcher keeps the page and remembers the choice', async ({ page, context }) => {
    await page.goto(`${BASE}/dining`)
    await page.locator('header a[hreflang="id"]').click()
    await expect(page).toHaveURL(/\/id\/bistro-coffee$/)
    const cookie = (await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')
    expect(cookie?.value).toBe('id')
  })

  test('sitemap lists all pages in both languages; robots.txt is served', async ({ request }) => {
    const sitemap = await (await request.get(`${BASE}/sitemap.xml`)).text()
    expect(sitemap.match(/<url>/g)?.length).toBe(PAGES.length)
    expect(sitemap).toContain('hreflang="x-default"')
    expect((await request.get(`${BASE}/robots.txt`)).status()).toBe(200)
  })
})

test('no broken internal links on any page', async ({ page, request }) => {
  test.setTimeout(180_000)
  const links = new Set<string>()
  for (const p of PAGES) {
    await page.goto(BASE + p.path)
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''))
    for (const h of hrefs) {
      if (!h.startsWith('/') || h.startsWith('//')) continue
      links.add(h.split('#')[0] || '/')
    }
  }
  const broken: string[] = []
  for (const link of links) {
    const res = await request.get(BASE + link, { maxRedirects: 5 })
    if (res.status() >= 400) broken.push(`${link} → ${res.status()}`)
  }
  expect(broken, `checked ${links.size} links`).toEqual([])
})

test.describe('Mobile (375 px)', () => {
  test.use({ viewport: { width: 375, height: 800 } })

  test('no page scrolls sideways', async ({ page }) => {
    test.setTimeout(120_000)
    const wide: string[] = []
    for (const p of PAGES) {
      await page.goto(BASE + p.path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (overflow > 1) wide.push(`${p.path} (+${overflow}px)`)
    }
    expect(wide).toEqual([])
  })

  test('menu opens, lists the pages and closes with Escape (layout v2 §4.1)', async ({ page }) => {
    await page.goto(BASE)
    const button = page.locator('header button[aria-controls="mobile-menu"]')
    await expect(button).toHaveAccessibleName('Open menu')
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    const panel = page.locator('#mobile-menu')
    await expect(panel.getByRole('link', { name: 'Contact' })).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAccessibleName('Open menu')
  })
})

test.describe('Interactions', () => {
  test('experience filters narrow the catalog and announce the count (layout v2 §4.5)', async ({ page }) => {
    await page.goto(BASE)
    const catalog = page.locator('#experiences')
    const cards = catalog.locator('ul.grid > li')
    const total = await cards.count()
    const pool = catalog.getByRole('button', { name: /^Pool \(\d+\)$/ })
    await pool.click()
    await expect(pool).toHaveAttribute('aria-pressed', 'true')
    const shown = await cards.count()
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(total)
    await expect(catalog.locator('[aria-live]')).toHaveText(`${shown} shown`)
  })

  test('FAQ answers open and close (F-10)', async ({ page }) => {
    await page.goto(`${BASE}/visit`)
    const item = page.locator('main details').first()
    const wasOpen = await item.evaluate((d) => (d as HTMLDetailsElement).open)
    await item.locator('summary').click()
    expect(await item.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(!wasOpen)
  })

  test('menu tabs work with the arrow keys', async ({ page }) => {
    await page.goto(`${BASE}/dining`)
    const tabs = page.getByRole('tab')
    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(page.getByRole('tabpanel')).toBeVisible()
  })

  test('gallery lightbox opens, closes with Escape and returns focus', async ({ page }) => {
    await page.goto(`${BASE}/gallery`)
    const first = page.locator('ul li button[aria-label]').first()
    await first.click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(first).toBeFocused()
  })
})

test.describe('Contact form (F-14)', () => {
  const email = 'e2e-visitor@qa.test'
  test.afterAll(async () => {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'inquiries', where: { email: { equals: email } } })
  })

  test('shows errors, moves focus, then sends', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    const form = page.locator('form')
    await form.getByRole('button', { name: /send/i }).click()
    await expect(form.locator('.field-error').first()).toBeVisible()
    await expect(form.locator('[name="name"]')).toBeFocused()

    await form.locator('[name="name"]').fill('E2E Visitor')
    await form.locator('[name="email"]').fill(email)
    await form.locator('[name="message"]').fill('Automated test message, please ignore.')
    await form.locator('[name="consent"]').check()
    await form.getByRole('button', { name: /send/i }).click()
    await expect(page.getByRole('status')).toBeVisible()
  })
})
