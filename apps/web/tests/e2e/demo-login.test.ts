import { expect, test } from '@playwright/test'

test('a visitor signs in with the demo patient account and sees the dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Demo patient' }).click()
  // The demo data includes conditions; without them, the dashboard sends the patient to onboarding.
  await expect(page.getByRole('heading', { level: 1, name: 'Patient Dashboard' })).toBeVisible()
  await expect(page).toHaveURL(/\/patient\/?$/)
})
