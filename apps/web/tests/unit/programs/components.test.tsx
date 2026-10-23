import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProgramReport } from "@/components/programs/ProgramReport"
import { ProgramTotals } from "@/components/programs/ProgramTotals"
import { buildPersonReport, MIN_GROUP_SIZE, programTotals, type ReportItem } from "@/lib/programs/report"

afterEach(cleanup)

const DAY = 86_400_000
const start = new Date("2026-06-01T12:00:00Z")
const at = (day: number, value: number) => ({ at: new Date(start.getTime() + day * DAY), value })
const weight: ReportItem = { variableId: "weight", name: "Weight", unitId: "kilogram", unit: "kg", kind: "check_in", better: "lower" }
const hba1c: ReportItem = { variableId: "hba1c", name: "HbA1c", unitId: "percent", unit: "%", kind: "lab", better: "lower" }

describe("program report", () => {
  it("shows the verdict, each measure before and now, and the caveat", () => {
    const report = buildPersonReport([weight, hba1c], new Map([["weight", [at(0, 100.04), at(84, 92.5)]]]), start, 12)
    render(<ProgramReport report={report} />)
    expect(screen.getByText("1 of 1 measures improved. 1 still needs a second value.")).toBeInTheDocument()
    const row = screen.getByRole("row", { name: /Weight/ })
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["100", "92.5", "−7.5 (−8%)", "Improved"])
    expect(within(screen.getByRole("row", { name: /HbA1c/ })).getByText("Waiting")).toBeInTheDocument()
    expect(screen.getByText(/does not prove that the product caused it/)).toBeInTheDocument()
  })
})

describe("program totals", () => {
  it("hides a small group and shows the counts of a large one", () => {
    const report = (after: number) => buildPersonReport([weight], new Map([["weight", [at(0, 100), at(84, after)]]]), start, 12)
    const small = programTotals([weight], [report(90)])
    const { rerender } = render(<ProgramTotals totals={small} />)
    expect(screen.getByText(`Shown when at least ${MIN_GROUP_SIZE} people have a value at the start and later.`)).toBeInTheDocument()
    // The exact number of a small group is hidden too.
    expect(within(screen.getByRole("row", { name: /Weight/ })).getAllByRole("cell")[0]).toHaveTextContent(`Fewer than ${MIN_GROUP_SIZE}`)

    rerender(<ProgramTotals totals={programTotals([weight], [90, 90, 90, 100, 110].map(report))} />)
    expect(screen.getByRole("img", { name: "3 improved, 1 unchanged, 1 review" })).toBeInTheDocument()
    expect(within(screen.getByRole("row", { name: /Weight/ })).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "5",
      "",
      "3 (60%)",
      "1 (20%)",
      "−10%",
    ])
  })
})
