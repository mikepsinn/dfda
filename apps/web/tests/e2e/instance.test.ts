import { expect, test } from '@playwright/test'
import { MEMBER_STATE, demo, onInstance } from './demo'

test.describe("a company's own site", () => {
  test('shows the company, its programs and no network pages', async ({ page }) => {
    await page.goto(onInstance('/'))
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: demo.instance.name })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(demo.instance.name)
    await expect(page.getByRole('heading', { name: 'How a program works' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toContainText(/Powered by/)

    await header.getByRole('link', { name: 'Programs' }).click()
    await expect(page).toHaveURL(/\/programs$/)
    await expect(page.getByRole('link', { name: /GLP-1 weight program/ })).toHaveAttribute('href', '/programs/glp-1')

    for (const path of ['/treatment-rankings', '/find-trials', '/select-role', '/patient']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
      await expect(page.getByRole('banner'), path).toContainText(demo.instance.name)
    }
  })

  test('has no network demo accounts on its sign-in page', async ({ page }) => {
    await page.goto(onInstance('/login'))
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Demo / })).toHaveCount(0)
  })

  test('sends a member to the programs after sign-in, where their program opens their own page', async ({ browser }) => {
    const page = await (await browser.newContext({ storageState: MEMBER_STATE })).newPage()
    await page.goto(onInstance('/auth/callback'))
    await expect(page).toHaveURL(/\/programs$/)
    await expect(page.getByRole('link', { name: /GLP-1 weight program.*Open your program/ })).toHaveAttribute(
      'href',
      '/programs/glp-1/me',
    )
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test("the main site keeps the network's pages", async ({ page }) => {
    const response = await page.goto('/treatment-rankings')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('banner')).not.toContainText(demo.instance.name)
    expect((await page.goto('/programs'))?.status()).toBe(404)
  })
})
