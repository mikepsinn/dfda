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
const action = async () => ({})
const values = () => Object.fromEntries(new FormData(screen.getByRole("button", { name: "Save" }).closest("form")!).entries())

describe("the form of a day", () => {
  it("sends no dose until the person says that they took it", async () => {
    render(<ProgramValuesForm action={action} fields={fields} defaultDate="2026-10-24" dateLabel="Date" submitLabel="Save" />)
    expect(values()).toEqual({ date: "2026-10-24", "value-weight": "" })

    const took = screen.getByRole("button", { name: "Took my dose (250 µg)" })
    expect(took).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(took)
    expect(took).toHaveAttribute("aria-pressed", "true")
    expect(values()).toMatchObject({ "value-dose": "250" })

    await userEvent.click(screen.getByRole("button", { name: "Other amount" }))
    await userEvent.type(screen.getByRole("spinbutton", { name: "BPC-157 amount (µg)" }), "500")
    expect(values()).toMatchObject({ "value-dose": "500" })
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
    expect(screen.getByRole("button", { name: "Took my dose (250 µg)" })).toHaveAttribute("aria-pressed", "true")
    expect(values()).toEqual({ date: "2026-10-24", "value-dose": "250", "value-pain": "3", "value-weight": "" })
  })
})
