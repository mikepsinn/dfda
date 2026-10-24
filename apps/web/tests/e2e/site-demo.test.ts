import { expect, test } from '@playwright/test'
import { COMPANY_STATE } from './demo'

// Demo mode of a company's site (lib/demo/instance.ts): the owner turns it on,
// and a visitor tries the site as the demo clinician and the demo patient.

test("a company turns on its site's demo; a visitor tries it as a clinician and as a patient", async ({ browser }) => {
  // A new site on each run, so that the test also passes on a database it used before.
  const slug = `demo-site-${Date.now().toString(36)}`
  const owner = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
  await owner.goto('/instances/new')
  await owner.getByLabel('Company name').fill('Demo Site Clinic')
  await owner.getByLabel('Byline (optional)').fill('by Demo Labs')
  await owner.getByLabel('Address', { exact: true }).fill(slug)
  await owner.getByRole('button', { name: 'Create instance' }).click()
  await expect(owner).toHaveURL(new RegExp(`/instances/${slug}\\?created=1`))

  // Without a program there is nothing to show.
  await owner.getByLabel('Show a demo on this site').check()
  await owner.getByRole('button', { name: 'Save changes' }).click()
  await expect(owner.getByText('Add a program first, then turn on the demo.')).toBeVisible()

  await owner.goto(`/instances/${slug}/programs/new`)
  await owner.getByRole('button', { name: 'GLP-1 program' }).click()
  await owner.getByRole('button', { name: 'Create program' }).click()
  await expect(owner.getByText('The program is live. People can join it now.')).toBeVisible()
  await owner.goto(`/instances/${slug}`)
  await owner.getByLabel('Show a demo on this site').check()
  await owner.getByRole('button', { name: 'Save changes' }).click()
  await expect(owner.getByText('Your changes are saved.')).toBeVisible()

  const clinician = await (await browser.newContext()).newPage()
  await clinician.goto(`/i/${slug}`)
  await expect(clinician.getByRole('heading', { level: 1 })).toHaveText('Demo Site Clinic')
  await expect(clinician.getByText('by Demo Labs').first()).toBeVisible()
  await clinician.getByRole('button', { name: 'Try it as a clinician' }).click()
  await expect(clinician).toHaveURL(new RegExp(`/instances/${slug}/care/[0-9a-f-]{36}$`))
  await expect(clinician.getByRole('heading', { level: 1, name: 'Riley Lee' })).toBeVisible()
  await expect(clinician.getByRole('navigation', { name: 'Chapters' })).toBeVisible()

  const patient = await (await browser.newContext()).newPage()
  await patient.goto(`/i/${slug}?next=${encodeURIComponent('/login')}`)
  await patient.getByRole('button', { name: 'Try it as a patient' }).click()
  await expect(patient).toHaveURL(/\/programs\/glp-1\/me$/)
  await expect(patient.getByRole('region', { name: 'Biomarker reports' })).toContainText(/How this patient's biology responded/)
})
