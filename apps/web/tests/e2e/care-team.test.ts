import { expect, test } from '@playwright/test'
import { CLINICIAN_STATE, COMPANY_STATE, MEMBER_STATE, demo, memberEmail, onInstance } from './demo'

// The care team adds a person's report file (lib/care-team). The tour
// (tour.test.ts) covers the review; this test uses a demo member, not the demo
// patient, so that it does not change the patient's reports during the tour.

test.describe('a clinician', () => {
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
})

// The owner invites a clinician by email. The demo member joins for this test
// and the owner removes them again, so the care team stays as the demo has it.
test.describe('the owner', () => {
  test.use({ storageState: COMPANY_STATE })

  test('invites a clinician by email, and the clinician joins with the link', async ({ page, browser }, testInfo) => {
    const email = memberEmail(1)
    await page.goto(`/instances/${demo.instance.slug}`)
    const careTeam = page.getByRole('region', { name: 'Care team' })
    await careTeam.getByLabel(/Clinician.s email/).fill(email)
    await careTeam.getByRole('button', { name: 'Send the invitation' }).click()
    // The tests have no mail server: the page then asks the owner to send the link.
    await expect(careTeam.getByText(`Could not send the email to ${email}`).or(careTeam.getByText(`We sent an invitation to ${email}`))).toBeVisible()
    const invitation = careTeam.getByRole('list', { name: 'Open invitations' }).getByRole('listitem').filter({ hasText: email })
    const link = (await invitation.getByText('/care-teams/join/').textContent())!.trim()

    const context = await browser.newContext({ storageState: MEMBER_STATE, baseURL: testInfo.project.use.baseURL })
    try {
      const clinician = await context.newPage()
      await clinician.goto(new URL(link).pathname)
      await expect(clinician.getByRole('heading', { level: 1, name: `Join the ${demo.instance.name} care team` })).toBeVisible()
      await clinician.getByRole('button', { name: 'Join the care team' }).click()
      await expect(clinician.getByRole('status').filter({ hasText: 'You are on the care team now.' })).toBeVisible()
      await expect(clinician.getByRole('heading', { level: 1, name: 'Patients' })).toBeVisible()
    } finally {
      await context.close()
    }

    await page.reload()
    await expect(invitation).toHaveCount(0)
    const member = careTeam.getByRole('listitem').filter({ hasText: email })
    await member.getByRole('button', { name: 'Remove' }).click()
    await expect(member).toHaveCount(0)
  })
})
