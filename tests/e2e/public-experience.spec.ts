import { expect, test } from '@playwright/test'

test('landing and authentication entry points are usable', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  await page.getByRole('link', { name: 'İşletmeni kur' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('SPA routes return the application shell', async ({ page }) => {
  await page.goto('/app/appointments')
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/business/demo')
  await expect(page.getByRole('heading', { name: 'İşletme özeti' })).toBeVisible()
})

test('PWA manifest declares standalone identity and icons', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBeTruthy()
  const manifest = (await response.json()) as {
    name?: string
    display?: string
    icons?: Array<{ sizes?: string }>
  }
  expect(manifest.name).toBe('Alley Randevu')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons?.some((icon) => icon.sizes === '512x512')).toBeTruthy()
})

test('service worker is generated and reachable', async ({ request }) => {
  const response = await request.get('/sw.js')
  expect(response.ok()).toBeTruthy()
  expect(await response.text()).toContain('precacheAndRoute')
})
