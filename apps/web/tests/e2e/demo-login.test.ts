import { expect, test } from '@playwright/test'
import { demo } from './demo'

test('a visitor signs in with the demo patient account and sees the dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Demo patient' }).click()
  // The demo data includes conditions; without them, the dashboard sends the patient to onboarding.
  await expect(page.getByRole('heading', { level: 1, name: 'Patient Dashboard' })).toBeVisible()
  await expect(page).toHaveURL(/\/patient\/?$/)
})

test.describe('the demo clinic', () => {
  test('a visitor opens it as its patient and sees their finished program on the clinic site', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Demo clinic patient' }).click()
    await expect(page).toHaveURL(new RegExp(`/programs/${demo.program.template}/me$`))
    await expect(page.getByRole('banner').getByRole('link', { name: demo.instance.name })).toBeVisible()
    const report = page.getByRole('region', { name: 'Before and now' })
    await expect(report).toContainText(/\d+ of \d+ measures improved\./)
    await expect(report.getByRole('row', { name: /^Weight/ })).toBeVisible()
  })

  test("a visitor opens it as its owner and sees the clinic's page", async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Demo clinic owner' }).click()
    await expect(page).toHaveURL(new RegExp(`/instances/${demo.instance.slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: demo.instance.name })).toBeVisible()
    await expect(page.getByRole('link', { name: /GLP-1 weight program/ })).toBeVisible()
  })
})
