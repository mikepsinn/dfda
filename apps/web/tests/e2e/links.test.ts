import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test'
import { appRoutes, routeOf } from '../shared/app-routes'
import { COMPANY_STATE, MEMBER_STATE, onInstance } from './demo'

/**
 * Every internal link must lead to a page that loads. The checker crawls from
 * a start page as a visitor, as each demo role and on a company's site. It
 * reads the server-rendered HTML, so links that only client code adds are not
 * crawled, and links that need data the demo accounts do not have are not
 * seen; tests/unit/links/static-links.test.ts checks every link in the code.
 * To stay fast, it checks at most PER_ROUTE links of each route of
 * apps/web/app (for example 2 of the 1,214 Outcome Labels).
 */

const PER_ROUTE = 2
const MAX_PAGES = 150

const ROUTES = appRoutes()

/** The route that serves a path, or the path itself when no route matches. */
function routeKey(pathname: string): string {
  return routeOf(pathname, ROUTES) ?? `no route: ${pathname}`
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&lt;': '<', '&gt;': '>' }

function linksIn(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/gi)].map((match) => match[1].replace(/&[#\w]+;/g, (entity) => ENTITIES[entity] ?? entity))
}

/**
 * An internal link as path and query, or null for a link the checker does not
 * follow: other sites, mail and phone links, in-page anchors, the preview
 * switch (/i, which changes the session's site) and sign-in endpoints.
 */
function internal(href: string, from: URL): string | null {
  if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return null
  const url = new URL(href, from)
  if (url.origin !== from.origin) return null
  if (url.pathname === '/i' || url.pathname.startsWith('/i/') || url.pathname.startsWith('/api/auth/')) return null
  return url.pathname + url.search
}

type Broken = { url: string; status: number; linkedFrom: string }

async function crawl(request: APIRequestContext, baseURL: string, start: string) {
  const queue = [{ url: start, linkedFrom: '(start page)' }]
  const queued = new Set([start])
  const checkedPerRoute = new Map<string, number>()
  const broken: Broken[] = []
  let checked = 0

  while (queue.length > 0 && checked < MAX_PAGES) {
    const { url, linkedFrom } = queue.shift()!
    const route = routeKey(new URL(url, baseURL).pathname)
    if ((checkedPerRoute.get(route) ?? 0) >= PER_ROUTE) continue
    checkedPerRoute.set(route, (checkedPerRoute.get(route) ?? 0) + 1)
    checked++

    const response = await request.get(url)
    if (response.status() >= 400) {
      broken.push({ url, status: response.status(), linkedFrom })
      continue
    }
    if (!(response.headers()['content-type'] ?? '').includes('text/html')) continue
    const page = new URL(response.url())
    for (const href of linksIn(await response.text())) {
      const next = internal(href, page)
      if (next && !queued.has(next)) {
        queued.add(next)
        queue.push({ url: next, linkedFrom: page.pathname + page.search })
      }
    }
  }
  return { broken, checked }
}

async function expectNoBrokenLinks(request: APIRequestContext, baseURL: string, start: string) {
  const { broken, checked } = await crawl(request, baseURL, start)
  expect(checked, 'pages checked').toBeGreaterThan(1)
  expect(broken, `Broken links found while checking ${checked} pages from ${start}`).toEqual([])
}

async function signInAsDemo(page: Page, role: string) {
  await page.goto('/login')
  await page.getByRole('button', { name: `Demo ${role}` }).click()
  await page.waitForURL((url) => url.pathname !== '/login')
}

async function contextPage(browser: Browser, storageState?: string) {
  return (await browser.newContext({ storageState })).newPage()
}

test.describe('every internal link leads to a page that loads', () => {
  test.describe.configure({ timeout: 180_000 })

  test('the checker reports a page that does not load', async ({ request, baseURL }) => {
    const { broken } = await crawl(request, baseURL!, '/no-page-for-the-link-checker')
    expect(broken).toEqual([{ url: '/no-page-for-the-link-checker', status: 404, linkedFrom: '(start page)' }])
  })

  test('on the network site, for a visitor', async ({ request, baseURL }) => {
    await expectNoBrokenLinks(request, baseURL!, '/')
  })

  for (const role of ['patient', 'provider', 'research partner', 'developer']) {
    test(`on the network site, for the demo ${role}`, async ({ browser, baseURL }) => {
      const page = await contextPage(browser)
      await signInAsDemo(page, role)
      await expectNoBrokenLinks(page.request, baseURL!, new URL(page.url()).pathname)
    })
  }

  test("on a company's site, for a visitor and a member", async ({ browser, baseURL }) => {
    for (const state of [undefined, MEMBER_STATE]) {
      const page = await contextPage(browser, state)
      // The preview link makes this browser's session show the company's site.
      await page.goto(onInstance('/'))
      await expectNoBrokenLinks(page.request, baseURL!, '/')
    }
  })

  test("on the company owner's pages", async ({ browser, baseURL }) => {
    const page = await contextPage(browser, COMPANY_STATE)
    await expectNoBrokenLinks(page.request, baseURL!, '/instances')
  })
})
