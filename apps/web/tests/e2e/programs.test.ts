import { expect, test, type Page } from '@playwright/test'
import { COMPANY_STATE, MEMBER_STATE, demo, onInstance } from './demo'

const programsPath = `/instances/${demo.instance.slug}/programs`

test.describe('the seeded program', () => {
  test('the company sees totals, not single values', async ({ browser }) => {
    const page = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
    await page.goto(`${programsPath}/${demo.program.template}`)
    await expect(page.getByText(`${demo.people} people have joined.`)).toBeVisible()
    const weight = page.getByRole('row', { name: /^Weight/ })
    await expect(weight.getByRole('img', { name: /^\d+ improved, \d+ no change, \d+ worse$/ })).toBeVisible()
  })

  test('a person who joined sees their before/after report', async ({ browser }) => {
    const page = await (await browser.newContext({ storageState: MEMBER_STATE })).newPage()
    await page.goto(onInstance(`/programs/${demo.program.template}/me`))
    const report = page.getByRole('region', { name: 'Before and now' })
    await expect(report.getByRole('row', { name: /^Weight/ })).toBeVisible()
  })

  test('a visitor who is not signed in is sent to register before joining', async ({ page }) => {
    await page.goto(onInstance(`/programs/${demo.program.template}`))
    await page.getByRole('button', { name: 'Join the program' }).click()
    await expect(page).toHaveURL(/\/register\?next=%2Fprograms%2Fglp-1$/)
  })
})

test('a company creates a program; a person joins it and records values', async ({ browser }) => {
  // A new address on each run, so the test also passes on a database it used before.
  const slug = `bpc-157-${Date.now().toString(36)}`

  const company: Page = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
  await company.goto(`${programsPath}/new`)
  await company.getByRole('button', { name: 'BPC-157 program' }).click()
  await company.getByLabel('Address', { exact: true }).fill(slug)
  await company.getByRole('button', { name: 'Create program' }).click()
  await expect(company.getByText('The program is live. People can join it now.')).toBeVisible()
  await expect(company.getByText('Nobody has joined yet.')).toBeVisible()

  const member: Page = await (await browser.newContext({ storageState: MEMBER_STATE })).newPage()
  await member.goto(onInstance(`/programs/${slug}`))
  await member.getByRole('button', { name: 'Join the program' }).click()
  await expect(member).toHaveURL(new RegExp(`/programs/${slug}/me\\?joined=1$`))

  // The dose field has the program's usual amount already.
  const today = member.getByRole('region', { name: 'Record a day' })
  await today.getByLabel(/^Pain/).fill('6')
  await today.getByLabel(/^Energy/).fill('4')
  await today.getByRole('button', { name: 'Save' }).click()
  await expect(today.getByRole('status')).toHaveText('Saved 3 values.')

  const labs = member.getByRole('region', { name: 'Lab results' })
  await labs.getByLabel(/^hs-CRP/).fill('2.5')
  await labs.getByRole('button', { name: 'Save lab results' }).click()
  await expect(labs.getByRole('status')).toHaveText('Saved 1 value.')

  // All values are from the first week, so they are the "before" values.
  await member.reload()
  const report = member.getByRole('region', { name: 'Before and now' })
  await expect(report).toContainText('No comparison yet')
  await expect(report.getByRole('row', { name: /^Pain/ })).toContainText('6')
  await expect(report.getByRole('row', { name: /^hs-CRP/ })).toContainText('2.5')

  // One person is too few for totals.
  await company.reload()
  await expect(company.getByText('1 person has joined.')).toBeVisible()
  await expect(company.getByRole('row', { name: /^Pain/ })).toContainText('Fewer than 5')
})
