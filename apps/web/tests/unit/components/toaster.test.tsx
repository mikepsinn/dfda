import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"

afterEach(cleanup)

describe("toasts", () => {
  it("show in the Toaster that the root layout mounts, from the one toast module", () => {
    render(<Toaster />)
    act(() => {
      toast({ title: "Reminder created", description: "Every day at 8:00" })
    })
    expect(screen.getByText("Reminder created")).toBeInTheDocument()
    expect(screen.getByText("Every day at 8:00")).toBeInTheDocument()
  })
})
