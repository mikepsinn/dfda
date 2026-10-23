// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { CarePatient, ReportSummary } from '@/lib/care-team/data'
import { isReviewDecision } from '@/lib/care-team/format'
import { attentionOrder } from '@/lib/care-team/queue'

const DAY = 86_400_000
const start = new Date('2026-07-01T09:00:00Z')
const at = (days: number) => new Date(start.getTime() + days * DAY)

function report(id: string, days: number, reviewed: boolean): ReportSummary {
  return {
    id,
    title: 'Report',
    reportDate: at(days),
    createdAt: at(days),
    reviewedAt: reviewed ? at(days + 1) : null,
    reviewerName: reviewed ? 'Dr. Test' : null,
    reviewNote: null,
    reviewDecision: reviewed ? 'continue' : null,
  }
}

function patient(name: string, sharedDays: number, reports: ReportSummary[]): CarePatient {
  return {
    enrollmentId: name,
    userId: name,
    name,
    email: `${name}@example.com`,
    program: { name: 'Program' } as CarePatient['program'],
    startedAt: start,
    sharedAt: at(sharedDays),
    reports,
  }
}

describe('attentionOrder', () => {
  it('puts reports to review first, the longest waiting first, then patients without a report, then the others', () => {
    const queue = attentionOrder([
      patient('reviewed-old', 0, [report('a', 10, true)]),
      patient('no-report-late', 20, []),
      patient('waiting-new', 0, [report('b', 30, false)]),
      patient('reviewed-new', 0, [report('c', 40, true)]),
      patient('no-report-early', 5, []),
      // The newest report is reviewed, but an older one still waits.
      patient('waiting-old', 0, [report('d', 50, true), report('e', 15, false)]),
    ])
    expect(queue.map((entry) => entry.name)).toEqual([
      'waiting-old',
      'waiting-new',
      'no-report-early',
      'no-report-late',
      'reviewed-new',
      'reviewed-old',
    ])
    expect(queue.map((entry) => [entry.state, entry.waiting])).toEqual([
      ['review', 1],
      ['review', 1],
      ['no-report', 0],
      ['no-report', 0],
      ['reviewed', 0],
      ['reviewed', 0],
    ])
  })

  it('counts every report that waits', () => {
    const [entry] = attentionOrder([patient('two', 0, [report('a', 30, false), report('b', 20, false), report('c', 10, true)])])
    expect(entry).toMatchObject({ state: 'review', waiting: 2 })
  })

  it('does not change the list it gets', () => {
    const patients = [patient('reviewed', 0, [report('a', 10, true)]), patient('waiting', 0, [report('b', 20, false)])]
    attentionOrder(patients)
    expect(patients.map((entry) => entry.name)).toEqual(['reviewed', 'waiting'])
  })
})

describe('isReviewDecision', () => {
  it('accepts the four decisions only', () => {
    for (const value of ['continue', 'adjust', 'investigate', 'insufficient']) expect(isReviewDecision(value)).toBe(true)
    for (const value of ['', 'stop', 'toString', 'constructor', null, undefined, 1]) expect(isReviewDecision(value)).toBe(false)
  })
})
