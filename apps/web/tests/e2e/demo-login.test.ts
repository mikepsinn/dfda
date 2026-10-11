import { expect, test } from '@playwright/test'

test('a visitor signs in with the demo patient account', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Demo patient' }).click()
  await expect(page).toHaveURL(/\/patient\/?$/)
})
