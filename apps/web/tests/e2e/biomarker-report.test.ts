import { expect, test } from '@playwright/test'
import { demo, onInstance } from './demo'

test('the example biomarker report links each panel from the summary', async ({ page }) => {
  await page.goto('/reports/example')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('semaglutide')

  await page.getByRole('region', { name: 'At a glance' }).getByRole('link', { name: 'Muscle & bone' }).click()
  await expect(page).toHaveURL(/#panel-muscle-bone$/)
  const panel = page.getByRole('region', { name: 'Muscle & bone' })
  await expect(panel).toBeInViewport()
  await expect(panel.getByRole('row', { name: /^IGF1/ })).toContainText('Review')
})

test("a company's site shows the report, and prints the report without the site header and footer", async ({ page }) => {
  await page.goto(onInstance('/reports/example'))
  await expect(page.getByRole('banner')).toContainText(demo.instance.name)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('banner')).toBeHidden()
  await expect(page.getByRole('contentinfo')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Muscle & bone' }).getByRole('row', { name: /^IGF1/ })).toBeVisible()
})
