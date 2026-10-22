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
  // On screen the report is a page of the site, with no paper; in print each sheet is the report's paper.
  const panel = page.getByRole('region', { name: 'Muscle & bone' })
  await expect(panel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(panel.getByText(/^Page \d+ of \d+$/)).toBeHidden()

  await page.emulateMedia({ media: 'print' })
  await expect(panel).toHaveCSS('background-color', 'rgb(249, 248, 245)')
  await expect(panel.getByText(/^Page \d+ of \d+$/)).toBeVisible()
  await expect(page.getByRole('banner')).toBeHidden()
  await expect(page.getByRole('contentinfo')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Muscle & bone' }).getByRole('row', { name: /^IGF1/ })).toBeVisible()
})

test("a program's example report prints one A4 page per sheet, as the clinician edition does", async ({ page }) => {
  await page.goto(onInstance('/programs/glp-1/example'))
  await expect(page.getByRole('heading', { level: 1 })).toContainText('semaglutide')
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByText('Page 13 of 13')).toBeVisible()
  // The page's own @page rule gives the size (A4) and no margin; a sheet that does not fit adds a page.
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1')
  expect(pdf.match(/\/Type\s*\/Page\b(?!s)/g)).toHaveLength(await page.locator('.report-sheet').count())
})
