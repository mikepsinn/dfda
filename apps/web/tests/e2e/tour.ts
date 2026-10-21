import { test, type Locator, type Page } from '@playwright/test'
import { tourScript } from '../shared/tour-script'

/**
 * Helpers for the tour (tour.test.ts), which follows the clinic demo's
 * journey script (content/clinic-demo/script.md). Normally the tour runs at
 * test speed. With DEMO_VIDEO=1 (`pnpm demo:video`) Playwright records a
 * video of each journey, and the tour shows each step's caption, a cursor and
 * smooth scrolling, and waits so that a viewer can read along.
 */

export const RECORDING = process.env.DEMO_VIDEO === '1'

const captions = new Map(tourScript().map((step) => [step.id, step.caption]))
const currentCaption = new WeakMap<Page, string>()

/** Time to read a caption: about 4 words a second, and at least 3 seconds. */
const readingTime = (caption: string) => Math.max(3_000, 1_500 + caption.split(/\s+/).length * 250)

/**
 * Draws the caption bar and the cursor dot on every page. They are added after
 * the page has loaded, outside the app's own elements, and they let clicks through.
 */
function overlay() {
  const ids = { caption: 'tour-caption', cursor: 'tour-cursor' }
  const draw = async () => {
    const root = document.documentElement
    let bar = document.getElementById(ids.caption)
    if (!bar) {
      bar = document.createElement('div')
      bar.id = ids.caption
      bar.setAttribute('aria-hidden', 'true')
      Object.assign(bar.style, {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        width: 'min(860px, calc(100vw - 32px))',
        padding: '12px 18px',
        borderRadius: '14px',
        background: 'rgba(15, 15, 18, 0.86)',
        color: '#fff',
        font: `500 ${window.innerWidth < 600 ? 15 : 20}px/1.4 system-ui, sans-serif`,
        textAlign: 'center',
        zIndex: '2147483647',
        pointerEvents: 'none',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      })
      root.appendChild(bar)
    }
    if (!document.getElementById(ids.cursor)) {
      const dot = document.createElement('div')
      dot.id = ids.cursor
      dot.setAttribute('aria-hidden', 'true')
      Object.assign(dot.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '22px',
        height: '22px',
        margin: '-11px 0 0 -11px',
        borderRadius: '50%',
        background: 'rgba(255, 196, 0, 0.45)',
        border: '2px solid rgba(255, 160, 0, 0.9)',
        transition: 'transform 0.25s ease-out',
        zIndex: '2147483647',
        pointerEvents: 'none',
      })
      root.appendChild(dot)
      document.addEventListener('mousemove', (event) => {
        dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`
      }, true)
    }
    const text = await (window as unknown as { tourCaption: () => Promise<string> }).tourCaption()
    bar.textContent = text
    bar.style.display = text ? 'block' : 'none'
  }
  ;(window as unknown as { tourRedraw: () => Promise<void> }).tourRedraw = draw
  window.addEventListener('load', () => setTimeout(draw, 300))
}

/** Sets up a page for the tour; in a recording, adds the caption bar and the cursor. */
export async function startTour(page: Page) {
  if (!RECORDING) return
  await page.exposeFunction('tourCaption', () => currentCaption.get(page) ?? '')
  await page.addInitScript(overlay)
}

/** One step of the script: in a recording, shows its caption, and after the step waits for the viewer to read it. */
export async function step(page: Page, id: string, body: () => Promise<void>) {
  const caption = captions.get(id)
  if (caption === undefined) throw new Error(`content/clinic-demo/script.md has no step "${id}".`)
  await test.step(`${id}: ${caption}`, async () => {
    currentCaption.set(page, caption)
    if (RECORDING) await page.evaluate(() => (window as unknown as { tourRedraw?: () => Promise<void> }).tourRedraw?.()).catch(() => {})
    await body()
    if (RECORDING) {
      await page.evaluate(() => (window as unknown as { tourRedraw?: () => Promise<void> }).tourRedraw?.()).catch(() => {})
      await page.waitForTimeout(readingTime(caption))
    }
  })
}

/** Brings an element into view: in a recording, with a smooth scroll and a pause. */
export async function show(locator: Locator) {
  if (!RECORDING) return locator.scrollIntoViewIfNeeded()
  await locator.evaluate((element) => element.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await locator.page().waitForTimeout(1_200)
}

/** Types into a field: in a recording, one key at a time. */
export async function type(locator: Locator, text: string) {
  if (!RECORDING) return locator.fill(text)
  await locator.click()
  await locator.pressSequentially(text, { delay: 35 })
}
