import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { EXAMPLE_REPORT } from "@/lib/biomarker-report/example"

afterEach(cleanup)

const cells = (row: HTMLElement) => within(row).getAllByRole("cell").map((cell) => cell.textContent)

describe("biomarker report", () => {
  it("lays the report out as numbered pages with the brand on each", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} brandName="Acme Metabolic" />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(EXAMPLE_REPORT.title)
    // Cover, at a glance, clinical values, 8 panels, the visit and the methods; every page but the cover has a footer.
    expect(screen.getByText("Page 2 of 13")).toBeInTheDocument()
    expect(screen.getByText("Page 13 of 13")).toBeInTheDocument()
    expect(screen.queryByText("Page 1 of 13")).toBeNull()
    expect(screen.getAllByText("Acme Metabolic Proteomic Response Report · Clinician edition")).toHaveLength(12)
  })

  it("shows the panels at a glance, with each panel's index and the totals", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    const glance = screen.getByRole("region", { name: "At a glance" })
    const review = within(glance).getByRole("heading", { name: "Review with the patient" }).parentElement!
    expect(within(review).getByRole("link", { name: "Muscle & bone" })).toHaveAttribute("href", "#panel-muscle-bone")
    expect(within(glance).getByRole("img", { name: "Metabolic & GLP-1 axis: +2.8× the noise, intended direction" })).toBeInTheDocument()
    expect(within(glance).getByRole("img", { name: "Muscle & bone: −0.9× the noise, review" })).toBeInTheDocument()
    expect(within(glance).getByText("Proteins in this report").nextElementSibling).toHaveTextContent("68")
  })

  it("shows each clinical value with its decimals, reference and status", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    expect(cells(screen.getByRole("row", { name: /^HbA1c/ }))).toEqual(["%", "6.1", "5.6", "−8%", "< 5.7", "Intended direction"])
    // A value below 100 shows one decimal at least.
    expect(cells(screen.getByRole("row", { name: /^ALT/ }))).toEqual(["U/L", "38.0", "27.0", "−29%", "7–35", "Intended direction"])
    // Below the assay limit at both timepoints: no change that the lab can see.
    expect(cells(screen.getByRole("row", { name: /^hs-cTnI/ }))).toEqual(["ng/L", "< 3", "< 3", "—", "< 16", "Unchanged"])
    expect(screen.getByText(/rose within the reference interval/)).toBeInTheDocument()
  })

  it("shows a clinical value's note in the table and in the list for phones", () => {
    const [first, ...rest] = EXAMPLE_REPORT.clinicalValues
    render(<BiomarkerReportView report={{ ...EXAMPLE_REPORT, clinicalValues: [{ ...first, note: "Fasting, morning draw" }, ...rest] }} />)
    expect(within(screen.getByRole("row", { name: /^Weight/ })).getByText("Fasting, morning draw")).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Laboratory values" })).getByText("Fasting, morning draw")).toBeInTheDocument()
  })

  it("draws the clinical value with more than two values, the dose and the reported effects", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    expect(screen.getByRole("img", { name: "Weight: Baseline 91.4 kg, Week 4 88.9 kg, Week 8 86.1 kg, Week 12 83.7 kg" })).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Dose schedule" })).getAllByRole("listitem").map((step) => step.textContent)).toEqual([
      "0.25 mg from week 0 to week 4",
      "0.5 mg from week 4 to week 8",
      "1.0 mg from week 8 to week 12",
    ])
    expect(within(screen.getByRole("table", { name: "Reported effects" })).getAllByRole("row")).toHaveLength(4)
  })

  it("shows each marker of a panel with its change, trend, noise multiple and status", () => {
    render(<BiomarkerReportView report={EXAMPLE_REPORT} />)
    const panel = screen.getByRole("region", { name: "Muscle & bone" })
    expect(within(panel).getByText(/^Organ response index −0\.9× noise band · 11 proteins · 0 moved \/ 7 unchanged \/ 4 review$/)).toBeInTheDocument()
    expect(cells(within(panel).getByRole("row", { name: /^IGF1/ }))).toEqual(["ng/mL", "142", "118", "−17%", "", "1.9×", "Review"])

    const crp = screen.getByRole("row", { name: /^CRP C-reactive protein/ })
    expect(cells(crp)).toEqual(["mg/L", "3.8", "1.9", "−50%", "", "2.5×", "Intended direction"])
    // The trend gives every timepoint in its accessible name.
    expect(within(crp).getByRole("img", { name: /^Baseline 3\.8, Week 4 \d\.\d, Week 8 \d\.\d, Week 12 1\.9$/ })).toBeInTheDocument()
    // Below the assay's limit: "< limit".
    expect(cells(screen.getByRole("row", { name: /^TNNT2/ })).slice(0, 3)).toEqual(["pg/mL", "< 5", "< 5"])
  })

  it("shows a marker value that is missing without a limit as missing, not as below the limit", () => {
    const [panel, ...panels] = EXAMPLE_REPORT.panels
    const [marker, ...markers] = panel.markers
    const report = { ...EXAMPLE_REPORT, panels: [{ ...panel, markers: [{ ...marker, values: [null, 500, 400, 370] }, ...markers] }, ...panels] }
    render(<BiomarkerReportView report={report} />)
    expect(cells(screen.getByRole("row", { name: /^INS Insulin/ })).slice(0, 3)).toEqual(["pg/mL", "–", "370"])
  })
})
