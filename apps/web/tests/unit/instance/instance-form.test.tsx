import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { InstanceForm } from "@/components/instance/InstanceForm"

afterEach(cleanup)

function renderForm() {
  render(<InstanceForm action={vi.fn(async () => ({}))} submitLabel="Create instance" siteHost="example.org" />)
  const preview = screen.getByRole("region", { name: "Preview" }).querySelector<HTMLElement>("[style]")!
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } })
  return { preview, type }
}

describe("the instance form", () => {
  it("previews the theme with the same CSS variables as the site", () => {
    const { preview, type } = renderForm()
    type("Background color", "#0d0f0e")
    fireEvent.change(screen.getByLabelText("Corners"), { target: { value: "large" } })
    fireEvent.change(screen.getByLabelText("Font"), { target: { value: "serif" } })

    expect(preview.style.getPropertyValue("--background")).toBe("150 7.1% 5.5%")
    expect(preview.style.getPropertyValue("--foreground")).toBe("150 7.1% 96%")
    expect(preview.style.getPropertyValue("--radius")).toBe("1rem")
    expect(preview.style.fontFamily).toContain("Georgia")
  })

  it("says when the background leaves no readable text color, and when the brand color is hard to read on it", () => {
    const { type } = renderForm()
    type("Background color", "#777777")
    expect(screen.getByText("Choose a lighter or a darker background, so that text is easy to read on it.")).toBeInTheDocument()

    type("Background color", "#ffffff")
    expect(screen.queryByText(/Choose a lighter or a darker background/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Links in the brand color are hard to read/)).not.toBeInTheDocument()
    type("Brand color", "#2fd4be")
    expect(screen.getByText(/Links in the brand color are hard to read on this background \(contrast 1\.\d to 1/)).toBeInTheDocument()
  })
})
