// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { caseMarkers, caseTimeline, draftNote, headlineMarkers } from '@/lib/care-team/case'
import { drugClassOf, evidenceFor } from '@/lib/care-team/evidence'
import type { ProgramItem } from '@/lib/programs/data'

const item = (kind: ProgramItem['kind'], variableId: string, name: string, unit: string): ProgramItem => ({
  id: variableId,
  kind,
  variableId,
  name,
  unitId: `${variableId}-unit`,
  unit,
  molarMass: null,
  frequency: null,
  better: null,
  defaultValue: null,
})

const program = {
  followUpWeeks: 12,
  items: [item('dose', 'dose', 'Semaglutide', 'mg'), item('check_in', 'energy', 'Energy', '0-10'), item('lab', 'alt', 'ALT', 'U/L')],
}
const startedAt = new Date('2026-07-01T00:00:00Z')
const atWeek = (week: number) => new Date(startedAt.getTime() + week * 7 * 86_400_000)

describe('the markers of a case', () => {
  const markers = caseMarkers(EXAMPLE_REPORT)

  it('are every marker of every panel, each with a key that selects it', () => {
    expect(markers).toHaveLength(EXAMPLE_REPORT.panels.reduce((total, panel) => total + panel.markers.length, 0))
    expect(new Set(markers.map((marker) => marker.key)).size).toBe(markers.length)
    expect(markers.find((marker) => marker.key === 'inflammation.CRP')).toMatchObject({ panelName: 'Inflammation', first: 3.8, status: 'intended' })
  })

  it('put the largest change of each panel first, with the largest change to review among them', () => {
    const headline = headlineMarkers(markers)
    expect(headline).toHaveLength(4)
    expect(new Set(headline.map((marker) => marker.panelId)).size).toBe(4)
    const review = markers.filter((marker) => marker.status === 'review').sort((a, b) => b.noiseMultiple! - a.noiseMultiple!)[0]
    expect(headline).toContain(review)
    const moved = headline.filter((marker) => marker !== review)
    expect(moved.map((marker) => marker.noiseMultiple)).toEqual([...moved.map((marker) => marker.noiseMultiple)].sort((a, b) => b! - a!))
  })

  it('give a draft note of facts: what moved as intended, what moved the other way, and what stayed', () => {
    const note = draftNote(markers).split('\n')
    expect(note[0]).toMatch(/^Since your baseline, these moved the way the program intends: .+ and \d+ more\.$/)
    expect(note[1]).toMatch(/^These moved the other way, and we will look at them together: /)
    expect(note[2]).toMatch(/^\d+ other markers stayed within your normal variation\.$/)
    // Long names give way to the identifier.
    expect(draftNote(markers)).not.toContain('Insulin-like growth factor-binding protein 1')
  })
})

describe('the timeline of a case', () => {
  it('has the dose as steps, check-ins and labs as points, and the reported effects as spans', () => {
    const series = new Map([
      ['dose', [0, 1, 2, 3, 4, 5].map((week) => ({ at: atWeek(week), value: week < 4 ? 0.25 : 0.5 }))],
      ['energy', [{ at: atWeek(-5), value: 4 }, { at: atWeek(-1), value: 5 }, { at: atWeek(6), value: 7 }]],
      ['alt', [{ at: atWeek(0), value: 38 }, { at: atWeek(12), value: 27 }]],
    ])
    const timeline = caseTimeline({ program, startedAt, series, report: EXAMPLE_REPORT })
    expect(timeline).toMatchObject({ start: -2, end: 12, samples: EXAMPLE_REPORT.timepoints })
    expect(timeline.lanes.map((lane) => `${lane.kind}:${lane.name}`)).toEqual(['steps:Semaglutide', 'points:Energy', 'points:ALT', 'spans:Reported effects'])
    expect(timeline.lanes[0]).toMatchObject({ steps: [{ from: 0, to: 4, amount: 0.25 }, { from: 4, to: 12, amount: 0.5 }] })
    // The value from five weeks before the start is left out.
    expect(timeline.lanes[1]).toMatchObject({ points: [{ week: -1, value: 5 }, { week: 6, value: 7 }] })
    expect(timeline.lanes[3]).toMatchObject({ spans: expect.arrayContaining([expect.objectContaining({ from: 2, to: 6, severity: 'notable' })]) })
  })

  it("takes the dose from the report when the person logged none, and has no lanes without logs or a report", () => {
    const fromReport = caseTimeline({ program, startedAt, series: new Map(), report: EXAMPLE_REPORT })
    expect(fromReport.lanes[0]).toEqual({
      kind: 'steps',
      name: 'Semaglutide',
      unit: 'mg',
      steps: [
        { from: 0, to: 4, amount: 0.25 },
        { from: 4, to: 8, amount: 0.5 },
        { from: 8, to: 12, amount: 1 },
      ],
    })
    expect(caseTimeline({ program, startedAt, series: new Map(), report: null })).toEqual({ start: 0, end: 12, samples: [], lanes: [] })
  })
})

describe('the evidence for a marker', () => {
  it('comes from the drug of the program, for markers with checked studies only', () => {
    expect(drugClassOf(program)).toBe('glp-1')
    expect(drugClassOf({ items: [item('dose', 'bpc', 'BPC-157', 'mcg')] })).toBeNull()
    expect(evidenceFor('glp-1', 'CRP')).toMatchObject({ expectation: 'down', sources: [expect.anything(), expect.anything()] })
    expect(evidenceFor('glp-1', 'IL-6')).toBe(evidenceFor('glp-1', 'IL6'))
    expect(evidenceFor('glp-1', 'GDF15')?.expectation).toBe('none')
    expect(evidenceFor('glp-1', 'LEP')).toBeNull()
    expect(evidenceFor(null, 'CRP')).toBeNull()
    for (const source of ['CRP', 'IL6', 'GDF15'].flatMap((id) => evidenceFor('glp-1', id)!.sources)) {
      expect(source.url).toMatch(/^https:\/\/(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov)\//)
    }
  })
})
