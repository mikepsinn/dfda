// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { withGeneratedText } from '@/lib/biomarker-report/text'

/** The example report as a file of values alone: no panel summaries and no card texts. */
const bare = { ...EXAMPLE_REPORT, glance: undefined, panels: EXAMPLE_REPORT.panels.map((panel) => ({ ...panel, summary: undefined })) }
const summaryOf = (report: typeof EXAMPLE_REPORT, id: string) => report.panels.find((panel) => panel.id === id)?.summary

describe('generated report texts', () => {
  const report = withGeneratedText(bare)

  it("writes each panel's summary from its counts and the proteins that moved furthest", () => {
    expect(summaryOf(report, 'metabolic')).toBe(
      "10 of 12 proteins moved beyond this patient's noise in the intended direction, and none moved the other way. " +
        'The largest changes: IGFBP1 +95% (5.9×), LEP −40% (3.6×), IGFBP2 +45% (3.4×).',
    )
    expect(summaryOf(report, 'muscle-bone')).toBe(
      "4 of 11 proteins moved beyond this patient's noise against the intended direction; " +
        'the largest: FSTL3 +27% (2.4×), IGF1 −17% (1.9×), SOST +22% (1.8×).',
    )
    expect(summaryOf(report, 'gut')).toBe("1 of 7 proteins moved beyond this patient's noise against the intended direction: FABP2 +36% (2.2×).")
    expect(summaryOf(report, 'kidney')).toBe("No protein in this panel moved beyond this patient's own noise.")
    // TNNT2 is below its limit at every timepoint.
    expect(summaryOf(report, 'cardiovascular')).toMatch(
      /^2 of 9 proteins .* The changes: SELE −26% \(2\.2×\), ICAM1 −15% \(1\.6×\)\. 1 protein was below the assay's limit, so it has no change\.$/,
    )
  })

  it('writes the text of each card on the summary page', () => {
    expect(report.glance).toEqual({
      intended: "21 of 39 proteins in these panels moved beyond this patient's noise in the intended direction, and none moved the other way.",
      unchanged: "No protein in these panels moved beyond this patient's own noise.",
      review:
        "5 proteins moved beyond this patient's noise against the intended direction; the largest: FSTL3 +27% (2.4×), FABP2 +36% (2.2×), IGF1 −17% (1.9×).",
    })
  })

  it('keeps the texts that the file gives', () => {
    expect(withGeneratedText(EXAMPLE_REPORT)).toEqual(EXAMPLE_REPORT)
    const withCard = withGeneratedText({ ...bare, glance: { review: 'Discuss lean mass.' } })
    expect(withCard.glance?.review).toBe('Discuss lean mass.')
    expect(withCard.glance?.intended).toMatch(/^21 of 39/)
  })

  it('tells a value that was not measured from a value below the limit', () => {
    const [panel, ...panels] = bare.panels.filter((each) => each.id === 'cardiovascular')
    const tnnt2 = panel.markers.find((marker) => marker.id === 'TNNT2')!
    const markers = panel.markers.map((marker) => (marker === tnnt2 ? { ...marker, lowerLimit: undefined } : marker))
    const report = withGeneratedText({ ...bare, panels: [{ ...panel, markers }, ...panels] })
    expect(report.panels[0].summary).toMatch(/1 protein had no value at the first or the last timepoint, so it has no change\.$/)
  })
})
