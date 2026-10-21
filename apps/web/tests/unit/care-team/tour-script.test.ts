// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_CAPTION_LENGTH, parseTourScript, SCRIPT_PATH, tourScript } from '../../shared/tour-script'

// The clinic demo's journey script (content/clinic-demo/script.md) and the tour
// that follows it (tests/e2e/tour.test.ts) must list the same steps in the same
// order, and each step must say what the tour checks and shows.

const script = readFileSync(SCRIPT_PATH, 'utf8')
const steps = tourScript()
const tour = readFileSync(join(__dirname, '../../e2e/tour.test.ts'), 'utf8')

describe('the clinic demo script', () => {
  it('has the steps of the tour, in the same order', () => {
    const toured = [...tour.matchAll(/step\(page, '([a-z]+-\d+)'/g)].map((match) => match[1])
    expect(toured).toEqual(steps.map((item) => item.id))
    expect(new Set(toured).size).toBe(toured.length)
  })

  it('gives every step a page, an action, what must be visible and a short caption', () => {
    for (const block of script.split(/^### /m).slice(1)) {
      for (const field of ['Page', 'Action', 'Must see', 'Caption']) {
        expect(block, `${block.split('\n')[0]} has no ${field}`).toMatch(new RegExp(`^- \\*\\*${field}:\\*\\* \\S`, 'm'))
      }
    }
    for (const item of steps) {
      expect(item.caption.length, `${item.id}: caption of ${item.caption.length} characters`).toBeLessThanOrEqual(MAX_CAPTION_LENGTH)
      expect(item.caption).not.toBe('')
    }
    expect(steps.length).toBe(script.split(/^### /m).length - 1)
  })

  it('reads the id, title and caption of each step', () => {
    expect(
      parseTourScript('# Title\n\n### owner-1: Opens the page\n\n- **Page:** x\n- **Caption:** The owner opens it.\n'),
    ).toEqual([{ id: 'owner-1', title: 'Opens the page', caption: 'The owner opens it.' }])
  })
})
