import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'
import { demo, onInstance } from './demo'
import { RECORDING, show, startTour, step, type } from './tour'

// The clinic demo's journeys (content/clinic-demo/script.md), step by step,
// in the order of the script: the patient, the clinician who signs off the
// patient's report, the patient who sees the sign-off, and the owner. Each
// step checks the script's "Must see". `pnpm demo:video` records one video
// per journey (scripts/demo-video.mjs).

test.describe.configure({ mode: 'serial' })
test.setTimeout(RECORDING ? 300_000 : 90_000)

const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false }

/**
 * A browser context for one journey, on a phone or a desktop. In a recording
 * it records a video at the size of the viewport, which `finish` saves as
 * `<name>.webm` in the test's output folder (scripts/demo-video.mjs collects it).
 */
async function journey(browser: Browser, device: typeof PHONE, testInfo: TestInfo, name: string) {
  const context = await browser.newContext({
    ...device,
    baseURL: testInfo.project.use.baseURL,
    recordVideo: RECORDING ? { dir: testInfo.outputPath('recording'), size: device.viewport } : undefined,
  })
  const page = await context.newPage()
  await startTour(page)
  return {
    page,
    async finish() {
      const video = page.video()
      await context.close()
      if (video) await video.saveAs(testInfo.outputPath(`${name}.webm`))
    },
  }
}

const reviewNote = 'Your markers moved the way the program intends. Keep the dose, add resistance training, and recheck at week 16.'

/** Signs in with a demo button on the clinic's own sign-in page. */
async function signInAs(page: Page, role: 'patient' | 'clinician' | 'owner') {
  // As a new visitor.
  await page.context().clearCookies()
  await page.goto(onInstance('/login'))
  await page.getByRole('button', { name: `Demo clinic ${role}` }).click()
}

test.describe('the patient', () => {
  test('finds the program, records a day and opens the week-12 report', async ({ browser }, testInfo) => {
    const { page, finish } = await journey(browser, PHONE, testInfo, '1-patient')
    try {
      await step(page, 'patient-1', async () => {
        await page.goto(onInstance('/'))
        await expect(page.getByRole('heading', { level: 1, name: demo.instance.name })).toBeVisible()
        await expect(page.getByText(demo.instance.tagline)).toBeVisible()
        await show(page.getByRole('heading', { name: 'Programs' }))
        await expect(page.getByRole('link', { name: /GLP-1 weight program/ })).toBeVisible()
      })

      await step(page, 'patient-2', async () => {
        await page.getByRole('link', { name: /GLP-1 weight program/ }).click()
        await expect(page.getByRole('heading', { level: 1, name: 'GLP-1 weight program' })).toBeVisible()
        await show(page.getByRole('heading', { name: 'What you do' }))
        await show(page.getByRole('heading', { name: 'What you get' }))
        await show(page.getByRole('heading', { name: `What ${demo.instance.name} sees` }))
        await expect(page.getByText(/The clinicians of its care team see your biomarker reports and your name/)).toBeVisible()
        // A clinic's treatment program: joining shares the reports with the care team, without a separate choice.
        await show(page.getByText(/In this program, .* care team adds and reviews your biomarker reports/))
        await expect(page.getByRole('checkbox', { name: /Share my biomarker reports/ })).toHaveCount(0)
      })

      await step(page, 'patient-3', async () => {
        await signInAs(page, 'patient')
        await expect(page).toHaveURL(/\/programs\/glp-1\/me$/)
        await expect(page.getByText('Your follow-up is due.')).toBeVisible()
        await expect(page.getByText(`Shared with ${demo.instance.name}'s care team since`)).toBeAttached()
        await expect(page.getByRole('button', { name: 'Stop sharing' })).toHaveCount(0)
      })

      await step(page, 'patient-4', async () => {
        const today = page.getByRole('region', { name: 'Record a day' })
        await show(today)
        await type(today.getByLabel(/^Weight/), '83.4')
        await type(today.getByLabel(/^Energy/), '7')
        await type(today.getByLabel(/^Nausea/), '1')
        await today.getByRole('button', { name: 'Save' }).click()
        await expect(today.getByRole('status')).toHaveText(/Saved \d+ values/)
      })

      await step(page, 'patient-5', async () => {
        const results = page.getByRole('region', { name: 'Before and now' })
        await show(results)
        await expect(results).toContainText(/\d+ of \d+ measures improved\./)
        await show(results.getByRole('row', { name: /^Weight/ }))
      })

      await step(page, 'patient-6', async () => {
        const reports = page.getByRole('region', { name: 'Biomarker reports' })
        await show(reports)
        await reports.getByRole('link', { name: /How this patient's biology responded/ }).click()
        await expect(page.getByRole('heading', { level: 1, name: /How this patient's biology responded/ })).toBeVisible()
        const review = page.getByRole('region', { name: 'Review' })
        await show(review)
        await expect(review).toContainText(/Waiting for review|Reviewed by/)
        await show(page.getByRole('region', { name: 'At a glance' }))
        await show(page.getByRole('heading', { name: 'Accredited laboratory values and program context.' }))
      })

      await step(page, 'patient-7', async () => {
        const print = page.getByRole('button', { name: 'Print or save as PDF' })
        await show(print)
        await expect(print).toBeVisible()
      })
    } finally {
      await finish()
    }
  })
})

test.describe('the clinician', () => {
  test("reviews the patient's report and signs it off", async ({ browser }, testInfo) => {
    const { page, finish } = await journey(browser, DESKTOP, testInfo, '2-clinician')
    try {
      await step(page, 'clinician-1', async () => {
        await signInAs(page, 'clinician')
        await expect(page).toHaveURL(new RegExp(`/instances/${demo.instance.slug}/care$`))
        await expect(page.getByRole('heading', { level: 1, name: 'Patients' })).toBeVisible()
        const riley = page.getByRole('row', { name: new RegExp(demo.patient.name) })
        await show(riley)
        await expect(riley).toContainText('GLP-1 weight program')
        await expect(riley).toContainText('1 report to review')
        // The patients with reports to review come first.
        await expect(page.getByRole('row').nth(1)).toContainText('to review')
      })

      await step(page, 'clinician-2', async () => {
        await page.getByRole('link', { name: demo.patient.name }).click()
        await expect(page.getByRole('heading', { level: 1, name: demo.patient.name })).toBeVisible()
        await expect(page.getByText('Shares reports since')).toBeVisible()
        await expect(page.getByRole('region', { name: 'Biomarker reports' }).getByRole('link')).toHaveCount(1)
        await show(page.getByRole('heading', { name: 'Add a report' }))
        await expect(page.getByLabel('Report file')).toBeVisible()
      })

      await step(page, 'clinician-3', async () => {
        await show(page.getByRole('region', { name: 'Biomarker reports' }))
        await page.getByRole('link', { name: /How this patient's biology responded/ }).click()
        await expect(page.getByRole('heading', { level: 1, name: /How this patient's biology responded/ })).toBeVisible()
        await show(page.getByRole('region', { name: 'At a glance' }))
        await show(page.getByRole('heading', { name: 'Sign off' }))
      })

      await step(page, 'clinician-4', async () => {
        const assistant = page.getByRole('region', { name: 'Ask about this report' })
        await show(assistant)
        await assistant.getByRole('button', { name: 'Which changes should I look at first, and why?' }).click()
        await assistant.getByRole('button', { name: 'Ask', exact: true }).click()
        // With the real Claude API (pnpm demo:video), a literature search can take a minute.
        const answer = assistant
          .getByRole('list', { name: 'Questions' })
          .getByRole('listitem')
          .filter({ hasText: 'Which changes should I look at first, and why?' })
          .last()
        await expect(answer.getByRole('list', { name: 'Sources' })).toBeVisible({ timeout: 120_000 })
        await show(answer)
      })

      await step(page, 'clinician-5', async () => {
        const decision = page.getByRole('group', { name: 'Decision for the care plan' })
        await show(decision)
        await decision.getByRole('radio', { name: /^Continue/ }).check()
        await type(page.getByLabel('Note for the person (optional)'), reviewNote)
        await page.getByRole('button', { name: 'Sign off' }).click()
        await expect(page.getByRole('status').filter({ hasText: 'Signed off' })).toBeVisible()
        const review = page.getByRole('region', { name: 'Review' })
        await show(review)
        await expect(review).toContainText(`Reviewed by ${demo.clinician.name}`)
        await expect(review).toContainText(reviewNote)
        await expect(review).toContainText('Decision: Continue')
      })
    } finally {
      await finish()
    }
  })
})

test.describe('the patient, after the review', () => {
  test("sees the clinician's sign-off on the report", async ({ browser }, testInfo) => {
    const { page, finish } = await journey(browser, PHONE, testInfo, '3-patient-review')
    try {
      await step(page, 'review-1', async () => {
        await signInAs(page, 'patient')
        await expect(page).toHaveURL(/\/programs\/glp-1\/me$/)
        const reports = page.getByRole('region', { name: 'Biomarker reports' })
        await show(reports)
        await expect(reports).toContainText('Reviewed')
        await reports.getByRole('link', { name: /How this patient's biology responded/ }).click()
        const review = page.getByRole('region', { name: 'Review' })
        await show(review)
        await expect(review).toContainText(`Reviewed by ${demo.clinician.name}`)
        await expect(review).toContainText(reviewNote)
        // The decision is for the care team.
        await expect(review).not.toContainText('Decision')
      })
    } finally {
      await finish()
    }
  })
})

test.describe('the owner', () => {
  test('sees the programs, the care team and the totals', async ({ browser }, testInfo) => {
    const { page, finish } = await journey(browser, DESKTOP, testInfo, '4-owner')
    try {
      await step(page, 'owner-1', async () => {
        await signInAs(page, 'owner')
        await expect(page.getByRole('heading', { level: 1, name: demo.instance.name })).toBeVisible()
        await expect(page.getByRole('link', { name: /GLP-1 weight program/ })).toBeVisible()
        const careTeam = page.getByRole('region', { name: 'Care team' })
        await show(careTeam)
        await expect(careTeam).toContainText(demo.clinician.name)
      })

      await step(page, 'owner-2', async () => {
        await show(page.getByRole('heading', { name: 'Programs' }))
        await page.getByRole('link', { name: /GLP-1 weight program/ }).click()
        await expect(page.getByRole('heading', { level: 1, name: 'GLP-1 weight program' })).toBeVisible()
        await show(page.getByRole('heading', { name: 'Results' }))
        await expect(page.getByText(/Totals only: you do not see any one person/)).toBeVisible()
      })
    } finally {
      await finish()
    }
  })
})
