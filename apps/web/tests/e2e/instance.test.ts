import { expect, test } from '@playwright/test'
import { contrastRatio } from '../../lib/instance/theme'
import { COMPANY_STATE, MEMBER_STATE, demo, onInstance } from './demo'

/** "rgb(47, 212, 190)" as "#2fd4be". */
const hexOf = (rgb: string) => `#${rgb.match(/\d+/g)!.slice(0, 3).map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`

test.describe("a company's own site", () => {
  test('shows the company, its programs and no network pages', async ({ page }) => {
    await page.goto(onInstance('/'))
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: demo.instance.name })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(demo.instance.name)
    await expect(page.getByRole('heading', { name: 'How a program works' })).toBeVisible()
    // The site is the company's own: its footer names no one else.
    await expect(page.getByRole('contentinfo')).toContainText(demo.instance.name)
    await expect(page.getByRole('contentinfo')).not.toContainText(/Powered by|Open Treatment Evidence Network|dFDA/)

    await header.getByRole('link', { name: 'Programs' }).click()
    await expect(page).toHaveURL(/\/programs$/)
    await expect(page.getByRole('link', { name: /GLP-1 weight program/ })).toHaveAttribute('href', '/programs/glp-1')

    for (const path of ['/treatment-rankings', '/find-trials', '/select-role', '/patient']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(404)
      await expect(page.getByRole('banner'), path).toContainText(demo.instance.name)
    }
  })

  test('has no network demo accounts, Google button or help address on its sign-in page', async ({ page }) => {
    await page.goto(onInstance('/login'))
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Demo / })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0)
    await expect(page.getByText(/help@dfda\.earth/)).toHaveCount(0)
  })

  test("describes itself to browsers and link previews as the company, with the network's own site unchanged", async ({ page, request }) => {
    await page.goto(onInstance('/'))
    const content = (selector: string) => page.locator(selector).first().getAttribute('content')
    expect(await content('meta[property="og:site_name"]')).toBe(demo.instance.name)
    expect(await content('meta[property="og:image:alt"]')).toBe(demo.instance.name)
    await expect(page.locator('meta[name="author"], meta[name="keywords"], meta[name="twitter:creator"]')).toHaveCount(0)
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/site-icon.png')
    // The preview link is for the company itself, not for search engines.
    expect(await content('meta[name="robots"]')).toContain('noindex')
    const image = await page.request.get('/share-image.png')
    expect(image.headers()['content-type']).toBe('image/png')

    // The network's own site keeps its name, icon and image.
    await page.goto('/i')
    expect(await content('meta[property="og:site_name"]')).not.toBe(demo.instance.name)
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/icon.svg')
    expect((await request.get('/icon.svg')).ok()).toBe(true)
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

  test("shows the theme that the owner sets: page colors on screen, light colors in print, readable brand text", async ({ browser }) => {
    const page = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
    async function setTheme(theme: { brand: string; background: string; font: string; corners: string }) {
      await page.goto(`/instances/${demo.instance.slug}`)
      await page.getByLabel('Brand color', { exact: true }).fill(theme.brand)
      await page.getByLabel('Background color', { exact: true }).fill(theme.background)
      await page.getByLabel('Font', { exact: true }).selectOption(theme.font)
      await page.getByLabel('Corners', { exact: true }).selectOption(theme.corners)
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect(page.getByText('Your changes are saved.')).toBeVisible()
    }

    try {
      await setTheme({ brand: '#6d4df6', background: '#0d0f0e', font: 'serif', corners: 'large' })
      await page.goto(onInstance('/'))
      const body = page.locator('body')
      await expect(page.locator('html')).toHaveClass(/\bdark-on-screen\b/)
      await expect(body).toHaveCSS('background-color', 'rgb(13, 15, 14)')
      await expect(body).toHaveCSS('font-family', /Georgia/)
      await expect(page.getByRole('link', { name: 'Programs' }).first()).toBeVisible()

      await page.emulateMedia({ media: 'print' })
      await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)')
      await page.emulateMedia({ media: 'screen' })

      // A light brand color on a light page: buttons keep it, and text in it gets darker until it reads.
      await setTheme({ brand: '#2fd4be', background: '#faf9f6', font: 'inter', corners: 'large' })
      await page.goto(onInstance('/'))
      // The theme keeps the brand color in whole percents of hue, saturation and lightness: within 2 of each channel.
      const button = await page.getByRole('link', { name: 'See the programs' }).evaluate((element) => getComputedStyle(element).backgroundColor)
      const channels = button.match(/\d+/g)!.slice(0, 3).map(Number)
      ;[47, 212, 190].forEach((value, index) => expect(Math.abs(channels[index] - value), button).toBeLessThanOrEqual(2))
      const heading = await page.getByRole('heading', { level: 1 }).evaluate((element) => getComputedStyle(element).color)
      expect(contrastRatio(hexOf(heading), '#faf9f6'), heading).toBeGreaterThanOrEqual(4.5)
    } finally {
      // Other tests use the same demo company.
      await page.emulateMedia({ media: 'screen' })
      await setTheme({ brand: '#6d4df6', background: '#ffffff', font: 'inter', corners: 'medium' })
    }
  })

  test("the main site keeps the network's pages", async ({ page }) => {
    const response = await page.goto('/treatment-rankings')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('banner')).not.toContainText(demo.instance.name)
    expect((await page.goto('/programs'))?.status()).toBe(404)
  })
})
