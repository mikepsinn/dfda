const WEEK = 7 * 86_400_000

/**
 * The largest report file that the care team can add. A valid report (at most
 * 20 panels of 60 markers) is smaller, and the limit stays under the 1 MB body
 * limit of server actions, so that the form can say what is wrong.
 */
export const MAX_REPORT_FILE_BYTES = 900_000

/** Where a person is in a program: "Week 3 of 12", or "Follow-up due" from the follow-up week on. */
export function programWeek(startedAt: Date, followUpWeeks: number, now = new Date()): string {
  const week = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / WEEK) + 1)
  return week > followUpWeeks ? 'Follow-up due' : `Week ${week} of ${followUpWeeks}`
}

/**
 * The clinician's decision when they sign off a report
 * (db/migrations/20261023010000_alter_biomarker_reports_review_decision.sql).
 * The care team sees it; the person sees the reviewer, the date and the note.
 */
export const REVIEW_DECISIONS = {
  continue: { label: 'Continue', description: 'Keep the current plan.' },
  adjust: { label: 'Adjust', description: 'Change the plan.' },
  investigate: { label: 'Investigate', description: 'Look into a finding before you decide.' },
  insufficient: { label: 'Not enough information', description: 'This report alone does not support a decision.' },
} as const

export type ReviewDecision = keyof typeof REVIEW_DECISIONS

export function isReviewDecision(value: unknown): value is ReviewDecision {
  return typeof value === 'string' && Object.hasOwn(REVIEW_DECISIONS, value)
}
