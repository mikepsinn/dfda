import type { CarePatient } from './data'

/** What a patient on the care team's list needs: reports to review, a first report, or nothing now. */
export type QueueState = 'review' | 'no-report' | 'reviewed'

export type QueueEntry = CarePatient & { state: QueueState; waiting: number }

const time = (date: Date) => date.getTime()

/**
 * The care team's patients in the order of what needs attention: first the
 * patients with reports that wait for review, the longest waiting first; then
 * the patients without a report, the longest sharing first; then the others,
 * the most recent report first.
 */
export function attentionOrder(patients: CarePatient[]): QueueEntry[] {
  const entries = patients.map((patient) => {
    const waiting = patient.reports.filter((report) => !report.reviewedAt)
    const state: QueueState = waiting.length > 0 ? 'review' : patient.reports.length === 0 ? 'no-report' : 'reviewed'
    const oldestWaiting = Math.min(...waiting.map((report) => time(report.createdAt)))
    return { entry: { ...patient, state, waiting: waiting.length }, oldestWaiting }
  })
  const rank = { review: 0, 'no-report': 1, reviewed: 2 } as const
  return entries
    .sort((a, b) => {
      if (a.entry.state !== b.entry.state) return rank[a.entry.state] - rank[b.entry.state]
      if (a.entry.state === 'review') return a.oldestWaiting - b.oldestWaiting
      if (a.entry.state === 'no-report') return time(a.entry.sharedAt) - time(b.entry.sharedAt)
      return time(b.entry.reports[0].reportDate) - time(a.entry.reports[0].reportDate)
    })
    .map(({ entry }) => entry)
}
