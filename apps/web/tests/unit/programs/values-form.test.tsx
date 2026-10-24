import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { ProgramValuesForm, type ValueField } from "@/components/programs/ProgramValuesForm"

afterEach(cleanup)

const fields: ValueField[] = [
  { id: "dose", name: "BPC-157", unit: "µg", kind: "dose", usual: 250 },
  { id: "pain", name: "Pain", unit: "/10", kind: "check_in", scale: { min: 0, max: 10, words: ["None", "Worst"] } },
  { id: "weight", name: "Weight", unit: "kg", kind: "check_in" },
]
const withUnits: ValueField = {
  id: "weight",
  name: "Weight",
  unit: "kg",
  kind: "check_in",
  units: [{ id: "kilogram", unit: "kg" }, { id: "pound", unit: "lb" }],
  unitId: "pound",
}
const action = async () => ({})
const values = () => Object.fromEntries(new FormData(screen.getByRole("button", { name: "Save" }).closest("form")!).entries())

describe("the form of a day", () => {
  it("sends no dose until the person says that they took it or skipped it", async () => {
    render(<ProgramValuesForm action={action} fields={fields} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    expect(values()).toEqual({ date: "2026-10-24", "value-weight": "" })

    const took = screen.getByRole("button", { name: "Took it (250 µg)" })
    const skipped = screen.getByRole("button", { name: "Skipped" })
    expect(took).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(took)
    expect(took).toHaveAttribute("aria-pressed", "true")
    expect(values()).toMatchObject({ "value-dose": "250" })

    // A skipped dose is a 0; a second tap clears the answer.
    await userEvent.click(skipped)
    expect(took).toHaveAttribute("aria-pressed", "false")
    expect(values()).toMatchObject({ "value-dose": "0" })
    await userEvent.click(skipped)
    expect(values()).not.toHaveProperty("value-dose")

    await userEvent.click(took)
    await userEvent.click(screen.getByRole("button", { name: "Other amount" }))
    await userEvent.type(screen.getByRole("spinbutton", { name: "BPC-157 amount (µg)" }), "500")
    expect(values()).toMatchObject({ "value-dose": "500" })
  })

  it("has a unit menu for a number with other units, with the person's unit chosen", async () => {
    render(<ProgramValuesForm action={action} fields={[withUnits]} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    const unit = screen.getByRole("combobox", { name: "Weight unit" })
    expect(within(unit).getAllByRole("option").map((option) => option.textContent)).toEqual(["kg", "lb"])
    expect(values()).toMatchObject({ "unit-weight": "pound" })
    await userEvent.selectOptions(unit, "kilogram")
    await userEvent.type(screen.getByRole("spinbutton", { name: "Weight" }), "80")
    expect(values()).toMatchObject({ "value-weight": "80", "unit-weight": "kilogram" })
    // A number without other units says its unit in the label.
    cleanup()
    render(<ProgramValuesForm action={action} fields={fields} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    expect(screen.getByRole("spinbutton", { name: "Weight (kg)" })).toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("rates on a scale with one button for each number, and clears the rating", async () => {
    render(<ProgramValuesForm action={action} fields={fields} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    const pain = screen.getByRole("group", { name: "Pain" })
    expect(within(pain).getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual(
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    )
    expect(within(pain).getByText("0 = None")).toBeInTheDocument()
    expect(within(pain).getByText("10 = Worst")).toBeInTheDocument()

    await userEvent.click(within(pain).getByRole("radio", { name: "6" }))
    expect(values()).toMatchObject({ "value-pain": "6" })
    await userEvent.click(within(pain).getByRole("button", { name: "Clear" }))
    expect(values()).not.toHaveProperty("value-pain")
  })

  it("clears the answers after a save and keeps them after an error", async () => {
    let result: { saved?: number; error?: string } = { error: "Pain: enter a number from 0 to 10." }
    render(<ProgramValuesForm action={async () => result} fields={fields} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    const six = () => within(screen.getByRole("group", { name: "Pain" })).getByRole("radio", { name: "6" })
    await userEvent.click(six())
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Pain: enter a number from 0 to 10.")
    expect(six()).toBeChecked()

    result = { saved: 1 }
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Saved 1 value.")
    expect(six()).not.toBeChecked()
  })

  it("shows the answer of a check-in link as chosen, on the link's day", () => {
    render(
      <ProgramValuesForm
        action={action}
        fields={fields}
        defaultDate="2026-10-24"
        dateLabel="Date"
        submitLabel="Save"
        fixedDate
        initialValues={{ pain: 3, dose: 250 }}
      />,
    )
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument()
    expect(within(screen.getByRole("group", { name: "Pain" })).getByRole("radio", { name: "3" })).toBeChecked()
    expect(screen.getByRole("button", { name: "Took it (250 µg)" })).toHaveAttribute("aria-pressed", "true")
    expect(values()).toEqual({ date: "2026-10-24", "value-dose": "250", "value-pain": "3", "value-weight": "" })
  })
})
