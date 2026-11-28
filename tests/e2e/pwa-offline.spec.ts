import { expect, test } from '@playwright/test'

test('cached application shell reloads offline and explains write limitations', async ({
  context,
  page
}) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })

  await page.reload()
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByText(/çevrimdışısınız|you are offline/i)).toBeVisible()
})
