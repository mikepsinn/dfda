import { expect, test } from '@playwright/test'
import { contrastRatio } from '../../lib/instance/theme'
import { COMPANY_STATE, MEMBER_STATE, demo, onInstance } from './demo'

/** "rgb(47, 212, 190)", or a mixed color such as "color(srgb 0.18 0.83 0.75)", as "#2fd4be". */
function hexOf(color: string) {
  const numbers = color.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const channels = color.startsWith('color(') ? numbers.map((value) => Math.round(value * 255)) : numbers
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

test.describe("a company's own site", () => {
  test('shows the company, its programs and no network pages', async ({ page }) => {
    await page.goto(onInstance('/'))
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: demo.instance.name })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(demo.instance.name)
    // A clinic's home page: for patients and for clinicians, with a case in four steps.
    await expect(page.getByRole('heading', { name: 'One case, from both sides' })).toBeVisible()
    await expect(page.getByRole('img', { name: /^A patient's case as the care team sees it/ })).toBeVisible()
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

  test("has no network demo accounts, Google button or help address on its sign-in page; the demo clinic has its own roles", async ({ page }) => {
    await page.goto(onInstance('/login'))
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
    // A real company's site has no demo buttons (lib/demo/sign-in.ts); the demo clinic offers its own roles.
    await expect(page.getByRole('button', { name: /^Demo / })).toHaveText(['Demo clinic owner', 'Demo clinic clinician', 'Demo clinic patient'])
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
    // The company's own domain answers with its slug; the domain check reads it (lib/instance/vercel-domains.ts).
    expect(await (await page.request.get('/api/instance')).json()).toEqual({ slug: demo.instance.slug })

    // The network's own site keeps its name, icon and image.
    await page.goto('/i')
    expect(await content('meta[property="og:site_name"]')).not.toBe(demo.instance.name)
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/icon.svg')
    expect(await (await page.request.get('/api/instance')).json()).toEqual({ slug: null })
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

      // The example report is a page of the dark site, with status colors that read on it, and prints on its light paper.
      await page.goto(onInstance('/reports/example'))
      const sheet = page.getByRole('region', { name: 'Muscle & bone' })
      await expect(sheet).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      const badge = sheet.getByText('Review', { exact: true }).first()
      const [text, fill] = await badge.evaluate((element) => [getComputedStyle(element).color, getComputedStyle(element).backgroundColor])
      expect(contrastRatio(hexOf(text), hexOf(fill)), `${text} on ${fill}`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(hexOf(text), '#0d0f0e'), text).toBeGreaterThanOrEqual(4.5)
      const doseSteps = await page.getByRole('list', { name: 'Dose schedule' }).getByRole('listitem').all()
      expect(doseSteps.length).toBeGreaterThan(0)
      for (const step of doseSteps) {
        const [label, stepFill] = await step.evaluate((element) => [getComputedStyle(element).color, getComputedStyle(element).backgroundColor])
        expect(contrastRatio(hexOf(label), hexOf(stepFill)), `${label} on ${stepFill}`).toBeGreaterThanOrEqual(4.5)
      }
      await page.emulateMedia({ media: 'print' })
      await expect(sheet).toHaveCSS('background-color', 'rgb(249, 248, 245)')
      await expect(badge).toHaveCSS('color', 'rgb(176, 117, 38)')
      await page.emulateMedia({ media: 'screen' })

      // A light brand color on a light page: buttons keep it, and text in it gets darker until it reads.
      await setTheme({ brand: '#2fd4be', background: '#faf9f6', font: 'inter', corners: 'large' })
      await page.goto(onInstance('/'))
      // The theme keeps the brand color in whole percents of hue, saturation and lightness: within 2 of each channel.
      const button = await page.getByRole('link', { name: 'See the programs' }).evaluate((element) => getComputedStyle(element).backgroundColor)
      const channels = button.match(/\d+/g)!.slice(0, 3).map(Number)
      ;[47, 212, 190].forEach((value, index) => expect(Math.abs(channels[index] - value), button).toBeLessThanOrEqual(2))
      const label = await page.getByText('How it works', { exact: true }).evaluate((element) => getComputedStyle(element).color)
      expect(contrastRatio(hexOf(label), '#faf9f6'), label).toBeGreaterThanOrEqual(4.5)
    } finally {
      // Other tests use the same demo company: back to its own colors (scripts/demo-data.json).
      await page.emulateMedia({ media: 'screen' })
      await setTheme({ brand: demo.instance.primaryColor, background: demo.instance.backgroundColor, font: 'inter', corners: 'medium' })
    }
  })

  test("shows the pages that the owner writes: in the menu, in the footer, and in place of the network's terms", async ({ browser, page }) => {
    const owner = await (await browser.newContext({ storageState: COMPANY_STATE })).newPage()
    // The owner confirms the deletes at the end.
    owner.on('dialog', (dialog) => dialog.accept())
    async function createPage(fill: { title: string; slug?: string; text: string; inMenu?: boolean }) {
      await owner.goto(`/instances/${demo.instance.slug}`)
      await owner.getByRole('link', { name: 'New page' }).click()
      await owner.getByLabel('Title').fill(fill.title)
      if (fill.slug) await owner.getByLabel('Address').fill(fill.slug)
      await owner.getByLabel('Text', { exact: true }).fill(fill.text)
      if (fill.inMenu) await owner.getByLabel(/Show in the top menu/).check()
      await owner.getByRole('button', { name: 'Create page' }).click()
      await expect(owner.getByText('The page is live on your site.')).toBeVisible()
    }

    try {
      await createPage({
        title: 'What we measure',
        text: ['## Organs', '', '| Organ | Markers |', '| --- | --- |', '| Heart | NT-proBNP, TNNT2 |'].join('\n'),
        inMenu: true,
      })
      // The address follows the title.
      await expect(owner).toHaveURL(/\/pages\/what-we-measure\?created=1$/)
      await createPage({ title: 'Terms of Use', slug: 'terms', text: 'These terms are between you and the company.' })

      await page.goto(onInstance('/'))
      await page.getByRole('banner').getByRole('link', { name: 'What we measure' }).click()
      await expect(page).toHaveURL(/\/pages\/what-we-measure$/)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('What we measure')
      await expect(page.getByRole('heading', { level: 2, name: 'Organs' })).toBeVisible()
      await expect(page.getByRole('cell', { name: 'NT-proBNP, TNNT2' })).toBeVisible()

      await page.getByRole('contentinfo').getByRole('link', { name: 'Terms of Use' }).click()
      await expect(page).toHaveURL(/\/terms$/)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of Use')
      await expect(page.getByText('These terms are between you and the company.')).toBeVisible()

      // The network's own site keeps its terms, and has no company pages.
      await page.goto('/i')
      await page.goto('/terms')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of Service')
      expect((await page.goto('/pages/what-we-measure'))?.status()).toBe(404)
    } finally {
      // Other tests use the same demo company.
      for (const slug of ['what-we-measure', 'terms']) {
        await owner.goto(`/instances/${demo.instance.slug}/pages/${slug}`)
        const remove = owner.getByRole('button', { name: 'Delete page' })
        if (await remove.isVisible()) {
          await remove.click()
          await expect(owner).toHaveURL(new RegExp(`/instances/${demo.instance.slug}$`))
        }
      }
    }
    await expect(owner.getByRole('region', { name: 'Pages' }).getByRole('listitem')).toHaveCount(0)
  })

  test("the main site keeps the network's pages", async ({ page }) => {
    const response = await page.goto('/treatment-rankings')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('banner')).not.toContainText(demo.instance.name)
    expect((await page.goto('/programs'))?.status()).toBe(404)
  })
})
