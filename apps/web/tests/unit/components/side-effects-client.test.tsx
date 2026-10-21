import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { SideEffectsClient } from "@/app/(protected)/patient/treatments/[patientTreatmentId]/side-effects/side-effects-client"
import { reportSideEffectAction } from "@/lib/actions/treatment-side-effects"

vi.mock("@/lib/actions/treatment-side-effects", () => ({
  reportSideEffectAction: vi.fn(async (input: { description: string; severity_out_of_ten: number }) => ({
    id: "saved-1",
    patient_treatment_id: "pt-1",
    description: input.description,
    severity_out_of_ten: input.severity_out_of_ten,
  })),
}))

beforeAll(() => {
  // JSDOM has no layout engine; the slider measures itself.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterEach(cleanup)
afterAll(() => vi.unstubAllGlobals())

describe("side effects of a treatment", () => {
  it("saves a new side effect, lists it and closes the dialog", async () => {
    const user = userEvent.setup()
    render(<SideEffectsClient patientTreatmentId="pt-1" treatmentName="Semaglutide" initialSideEffects={[]} />)

    await user.click(screen.getByRole("button", { name: "Add Side Effect" }))
    await user.type(screen.getByLabelText("Description"), "Nausea after the injection")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(reportSideEffectAction).toHaveBeenCalledWith({
      patient_treatment_id: "pt-1",
      description: "Nausea after the injection",
      severity_out_of_ten: 5,
    })
    expect(await screen.findByText("Nausea after the injection")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
