import { expect, test } from '@playwright/test'
import { CLINICIAN_STATE, demo, onInstance } from './demo'

// The care team adds a person's report file (lib/care-team). The tour
// (tour.test.ts) covers the review; this test uses a demo member, not the demo
// patient, so that it does not change the patient's reports during the tour.

test.use({ storageState: CLINICIAN_STATE })

test('the care team adds a report file after the file check, and removes it before anyone signs it off', async ({ page }) => {
  const member = demo.memberNames[1]
  await page.goto(onInstance(`/instances/${demo.instance.slug}/care`))
  await page.getByRole('link', { name: member }).click()
  await expect(page.getByRole('heading', { level: 1, name: member })).toBeVisible()

  const file = page.getByLabel('Report file')
  const add = page.getByRole('button', { name: 'Add the report' })
  await file.setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"title": "Notes"}') })
  await add.click()
  const problems = page.getByRole('alert').filter({ hasText: 'The file is not a valid report.' })
  await expect(problems).toBeVisible()
  await expect(problems).toContainText('timepoints')

  const example = await (await page.request.get('/reports/example.json')).body()
  await file.setInputFiles({ name: 'example-report.json', mimeType: 'application/json', buffer: example })
  await add.click()
  await expect(page.getByRole('status').filter({ hasText: 'The report is saved.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Review' })).toContainText('Waiting for review')

  await page.getByRole('button', { name: 'Remove this report' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'The report is removed.' })).toBeVisible()
  await expect(page.getByText('No report yet.')).toBeVisible()
})
