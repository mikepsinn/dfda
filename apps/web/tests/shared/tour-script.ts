import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The steps of the clinic demo's journey script (content/clinic-demo/script.md),
 * in the order of the file. The tour test (tests/e2e/tour.test.ts) shows each
 * caption, and a unit test keeps the script and the tour in step.
 */
export type TourStep = { id: string; title: string; caption: string }

export const SCRIPT_PATH = join(__dirname, '../../content/clinic-demo/script.md')
export const MAX_CAPTION_LENGTH = 140

export function parseTourScript(markdown: string): TourStep[] {
  const steps: TourStep[] = []
  for (const block of markdown.split(/^### /m).slice(1)) {
    const heading = /^([a-z]+-\d+): (.+)$/m.exec(block)
    if (!heading) continue
    const caption = /^- \*\*Caption:\*\* (.+)$/m.exec(block)
    steps.push({ id: heading[1], title: heading[2].trim(), caption: caption?.[1].trim() ?? '' })
  }
  return steps
}

export function tourScript(): TourStep[] {
  return parseTourScript(readFileSync(SCRIPT_PATH, 'utf8'))
}
