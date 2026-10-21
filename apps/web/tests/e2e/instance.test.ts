import { expect, test } from '@playwright/test'
import { COMPANY_STATE, MEMBER_STATE, demo, onInstance } from './demo'

test.describe("a company's own site", () => {
  test('shows the company, its programs and no network pages', async ({ page }) => {
    await page.goto(onInstance('/'))
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: demo.instance.name })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(demo.instance.name)
    await expect(page.getByRole('heading', { name: 'How a program works' })).toBeVisible()
    // In a preview, the link to the network's site ends the preview first.
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Open Treatment Evidence Network' })).toHaveAttribute('href', '/i')

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

    // A signed-in member who opens the sign-in page also goes to the programs, not to a role dashboard.
    await page.goto('/login')
    await expect(page).toHaveURL(/\/programs$/)
  })

  test("shows the theme that the owner sets: page colors on screen, light colors in print", async ({ browser }) => {
    const page = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
    async function setTheme(theme: { background: string; font: string; corners: string }) {
      await page.goto(`/instances/${demo.instance.slug}`)
      await page.getByLabel('Background color', { exact: true }).fill(theme.background)
      await page.getByLabel('Font', { exact: true }).selectOption(theme.font)
      await page.getByLabel('Corners', { exact: true }).selectOption(theme.corners)
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page.getByText('Your changes are saved.')).toBeVisible()
    }

    try {
      await setTheme({ background: '#0d0f0e', font: 'serif', corners: 'large' })
      await page.goto(onInstance('/'))
      const body = page.locator('body')
      await expect(page.locator('html')).toHaveClass(/\bdark-on-screen\b/)
      await expect(body).toHaveCSS('background-color', 'rgb(13, 15, 14)')
      await expect(body).toHaveCSS('font-family', /Georgia/)
      await expect(page.getByRole('link', { name: 'Programs' }).first()).toBeVisible()

      await page.emulateMedia({ media: 'print' })
      await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    } finally {
      // Other tests use the same demo company.
      await page.emulateMedia({ media: 'screen' })
      await setTheme({ background: '#ffffff', font: 'inter', corners: 'medium' })
    }
  })

  test("the main site keeps the network's pages", async ({ page }) => {
    const response = await page.goto('/treatment-rankings')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('banner')).not.toContainText(demo.instance.name)
    expect((await page.goto('/programs'))?.status()).toBe(404)
  })
})
