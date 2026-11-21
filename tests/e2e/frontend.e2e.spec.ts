import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('English homepage is the default (no prefix)', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/D’Sanga/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('h1').first()).toHaveText('More Than a Place, a Space for Everyone')
  })

  test('Indonesian homepage lives under /id', async ({ page }) => {
    await page.goto('http://localhost:3000/id')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(page.locator('h1').first()).toHaveText('Lebih dari Sekadar Tempat, Ini Ruang untuk Semua')
  })

  test('Indonesian slugs map to the same page and English slugs redirect', async ({ page }) => {
    await page.goto('http://localhost:3000/id/dining')
    await expect(page).toHaveURL(/\/id\/bistro-coffee$/)
    await page.goto('http://localhost:3000/en/pool')
    await expect(page).toHaveURL(/\/pool$/)
  })
})
