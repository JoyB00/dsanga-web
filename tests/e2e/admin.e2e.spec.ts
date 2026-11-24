import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { cleanupOrders, rememberCounters } from '../helpers/orders'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    // Starting Payload and loading the admin panel is slow while the other workers start up.
    test.setTimeout(120_000)
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('dashboard shows the temporary-data status (F-15)', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.getByRole('heading', { name: /Temporary data:|All published content is verified/ })).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(\?|$)/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('order agreed on WhatsApp → invoice → private link and PDF', async () => {
    test.setTimeout(180_000)
    const customer = 'E2E Customer'
    await cleanupOrders(customer)
    await rememberCounters()
    try {
      await page.goto('http://localhost:3000/admin/collections/orders/create')
      await page.fill('#field-customerName', customer)
      await page.fill('#field-customerWhatsapp', '0812 0000 0000')
      await page.locator('#field-visitAt input').fill('10 Jan 2031 10:00')
      await page.keyboard.press('Tab')
      await page.fill('#field-people', '4')
      await page.getByRole('button', { name: /Add Produk/i }).click()
      // Picking a product fills description and price; both stay editable.
      const picker = page.getByLabel('Pilih dari daftar produk')
      await expect(picker).toBeEnabled({ timeout: 30_000 })
      await picker.selectOption({ label: 'Pool – Dewasa (hari kerja) — Rp50.000' })
      await expect(page.locator('#field-items__0__unitPrice')).toHaveValue('50000')
      await page.fill('#field-items__0__quantity', '4')
      await page.locator('#action-save').click()
      await page.waitForURL(/orders\/\d+/, { timeout: 60_000 })

      await page.getByRole('button', { name: 'Buat invoice' }).click()
      await page.waitForURL(/invoices\/\d+/, { timeout: 60_000 })
      const send = await page.getByRole('link', { name: 'Kirim via WhatsApp' }).getAttribute('href')
      expect(send).toContain('https://wa.me/6281200000000?text=')
      const link = (await page.getByRole('link', { name: 'Lihat invoice' }).getAttribute('href'))!
      expect(decodeURIComponent(send!)).toContain(link)

      // The customer has no account: open the link in a clean browser.
      const context = await page.context().browser()!.newContext({ viewport: { width: 375, height: 812 } })
      const visitor = await context.newPage()
      await visitor.goto(link)
      await expect(visitor.getByText('Rp200.000').last()).toBeVisible()
      await expect(visitor.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      expect(await visitor.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
      const axe = await new AxeBuilder({ page: visitor }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      expect(axe.violations.map((v) => v.id)).toEqual([])
      const pdf = await visitor.request.get(`${link}/pdf`)
      expect(pdf.headers()['content-type']).toBe('application/pdf')
      expect((await visitor.request.get(link.slice(0, -1) + (link.endsWith('0') ? '1' : '0'))).status()).toBe(404)
      expect((await visitor.request.get('http://localhost:3000/api/invoices')).status()).toBe(403)
      expect((await visitor.request.get('http://localhost:3000/api/orders')).status()).toBe(403)
      await context.close()
    } finally {
      await cleanupOrders(customer)
    }
  })
})
