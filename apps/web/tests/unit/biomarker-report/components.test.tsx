import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { EXAMPLE_REPORT } from "@/lib/biomarker-report/example"

afterEach(cleanup)

const cells = (row: HTMLElement) => within(row).getAllByRole("cell").map((cell) => cell.textContent)

describe("biomarker report", () => {
  it("shows the panels at a glance, with each panel's index and the totals", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(EXAMPLE_REPORT.title)

    const glance = screen.getByRole("region", { name: "At a glance" })
    const review = within(glance).getByRole("heading", { name: "Review with the patient" }).parentElement!
    expect(within(review).getByRole("link", { name: "Muscle & bone" })).toHaveAttribute("href", "#panel-muscle-bone")
    expect(within(glance).getByRole("img", { name: "Metabolic & GLP-1 axis: +2.5× the noise, intended direction" })).toBeInTheDocument()
    expect(within(glance).getByRole("img", { name: "Muscle & bone: −1.6× the noise, review" })).toBeInTheDocument()
    expect(within(glance).getByText("Markers in this report").nextElementSibling).toHaveTextContent("20")
  })

  it("shows each clinical value with its decimals, reference and status", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    expect(cells(screen.getByRole("row", { name: /^HbA1c/ }))).toEqual(["%", "6.0", "5.5", "−8%", "", "< 5.7", "Intended direction"])
    expect(cells(screen.getByRole("row", { name: /^hs-cTnI/ }))).toEqual(["ng/L", "< 3", "< 3", "–", "", "< 20", "Below limit"])
    expect(screen.getByText(/Rose within the reference interval/)).toBeInTheDocument()
  })

  it("shows each marker of a panel with its change, trend, noise multiple and status", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    const panel = screen.getByRole("region", { name: "Muscle & bone" })
    expect(within(panel).getByText("Index −1.6× the noise · 4 markers: 0 intended, 2 unchanged, 2 to review")).toBeInTheDocument()
    expect(cells(within(panel).getByRole("row", { name: /^IGF1/ }))).toEqual(["ng/mL", "151", "126", "−17%", "", "2.1×", "Review"])

    const crp = screen.getByRole("row", { name: /^CRP C-reactive protein/ })
    expect(cells(crp)).toEqual(["mg/L", "3.2", "1.7", "−47%", "", "2.1×", "Intended direction"])
    // The trend gives every timepoint in its accessible name.
    expect(within(crp).getByRole("img", { name: /^Baseline 3\.2, Week 4 \d\.\d, Week 8 \d\.\d, Week 12 1\.7$/ })).toBeInTheDocument()
  })
})
