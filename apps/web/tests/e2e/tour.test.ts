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
// A recording uses one 16:9 desktop size for every journey.
// scripts/demo-video.mjs scales its videos to 1920x1080, so that the text is
// about 1.7 times as large as on a 1080p screen and easy to read on a phone too.
const VIDEO = { viewport: { width: 1152, height: 648 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false }

/**
 * A browser context for one journey, on a phone or a desktop. In a recording
 * it uses the VIDEO size instead and records a video of that size, which
 * `finish` saves as `<name>.webm` in the test's output folder
 * (scripts/demo-video.mjs collects it).
 */
async function journey(browser: Browser, device: typeof PHONE, testInfo: TestInfo, name: string) {
  const context = await browser.newContext({
    ...(RECORDING ? VIDEO : device),
    baseURL: testInfo.project.use.baseURL,
    recordVideo: RECORDING ? { dir: testInfo.outputPath('recording'), size: VIDEO.viewport } : undefined,
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

// The plan that the clinician adds to the draft note.
const reviewNote = 'Plan: keep the dose, add resistance training, and recheck at week 16.'

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
        await expect(page.getByText(/The clinicians of its care team see your name, your biomarker reports, what you log in the program and the symptoms that you rate/)).toBeVisible()
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
        await type(today.getByLabel('Weight', { exact: true }), '83.4')
        await today.getByRole('group', { name: 'Energy' }).getByText('7', { exact: true }).click()
        await today.getByRole('group', { name: 'Nausea' }).getByText('1', { exact: true }).click()
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
        const chapters = page.getByRole('navigation', { name: 'Chapters' })
        await expect(chapters.getByRole('link')).toHaveText(['Baseline', 'Track', 'Follow-up', 'Decide'])
        await expect(page.getByRole('region', { name: /^\d[\d,]* proteins measured$/ })).toContainText('Baseline · Day 0')
        const timeline = page.getByRole('region', { name: 'Baseline to follow-up' })
        await show(timeline)
        await expect(timeline.getByRole('img')).toHaveAccessibleName(/^Samples: Baseline on /)
      })

      await step(page, 'clinician-3', async () => {
        await page.getByRole('navigation', { name: 'Chapters' }).getByRole('link', { name: 'Track' }).click()
        const track = page.getByRole('region', { name: 'What surrounded the change' })
        await show(track)
        // The dose as steps, and the check-ins that Riley logged, on the weeks of the samples.
        await expect(track.getByRole('img', { name: /^Semaglutide: [\d.]+ mg from / })).toBeVisible()
        await expect(track.getByRole('img', { name: /^Energy: \d+ values from/ })).toBeVisible()
        await expect(track.getByRole('img', { name: /^Reported effects:/ })).toBeVisible()
      })

      await step(page, 'clinician-4', async () => {
        await page.getByRole('navigation', { name: 'Chapters' }).getByRole('link', { name: 'Follow-up' }).click()
        await show(page.getByRole('heading', { name: 'Grouped by pathway, not a single score' }))
        await expect(page.getByRole('list', { name: 'Largest changes' }).getByRole('listitem')).toHaveCount(4)
        await page.getByRole('list', { name: 'Markers of Inflammation' }).getByRole('link', { name: 'CRP', exact: true }).click()
        const marker = page.getByRole('region', { name: /^CRP · C-reactive protein/ })
        await expect(marker).toBeVisible()
        await show(marker)
        await expect(marker.getByRole('img')).toHaveAccessibleName(/^C-reactive protein: Baseline 3\.8 mg\/L/)
        await marker.getByRole('button', { name: 'Why a decrease was expected' }).click()
        const sources = page.getByRole('dialog', { name: 'Why a decrease was expected' })
        await expect(sources.getByRole('link', { name: /Verma et al\. 2022/ })).toBeVisible()
        await show(sources.getByRole('link', { name: /Plutzky et al\. 2026/ }))
        await page.keyboard.press('Escape')
        await expect(sources).toBeHidden()
      })

      await step(page, 'clinician-5', async () => {
        await page.getByRole('navigation', { name: 'Chapters' }).getByRole('link', { name: 'Decide' }).click()
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

      await step(page, 'clinician-6', async () => {
        const note = page.getByLabel('Note for the person')
        await show(note)
        await expect(note).toHaveValue(/^Since your baseline, these moved the way the program intends: /)
        await expect(page.getByText('Draft from the report', { exact: true })).toBeVisible()
        // The clinician adds the plan to the draft.
        await note.click()
        await note.press('ControlOrMeta+End')
        await note.pressSequentially(`\n${reviewNote}`, { delay: RECORDING ? 35 : 0 })
        await expect(page.getByText('Edited by clinician', { exact: true })).toBeVisible()
        await page.getByRole('group', { name: 'Decision for the care plan' }).getByRole('radio', { name: /^Continue/ }).check()
        await page.getByText('I reviewed this report and the note').click()
        await expect(page.getByText('Reviewed by clinician', { exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Sign off' }).click()
        await expect(page.getByRole('status').filter({ hasText: 'Signed off' })).toBeVisible()
        const review = page.getByRole('region', { name: 'Review', exact: true })
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
