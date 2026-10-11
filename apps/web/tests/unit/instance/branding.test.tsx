import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Footer } from "@/components/Footer"
import { HeroSection } from "@/components/HeroSection"

afterEach(cleanup)

describe("instance branding", () => {
  it("shows the company name, tagline and products in the hero, with a way to start tracking", () => {
    render(<HeroSection instance={{ name: "Acme Proteomics", tagline: "Track your peptides.", products: ["BPC-157", "Proteomics panel"] }} />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Acme Proteomics")
    expect(screen.getByText("Track your peptides.")).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Products" })).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["BPC-157", "Proteomics panel"])
    expect(screen.getByRole("link", { name: /Start tracking/ })).toHaveAttribute("href", "/register")
  })

  it("keeps the network's hero without an instance", () => {
    render(<HeroSection />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Open Treatment Evidence Network")
    expect(screen.queryByRole("link", { name: /Start tracking/ })).not.toBeInTheDocument()
  })

  it("names the network that runs an instance in its footer, with the company's letter as its logo", () => {
    const { container } = render(
      <Footer
        siteName="Acme Proteomics"
        brand={{ name: "Acme Proteomics", logoUrl: null }}
        poweredBy={{ name: "Open Treatment Evidence Network", url: "https://prototype.dfda.earth" }}
      />,
    )
    expect(container.querySelector("footer span[aria-hidden='true']")).toHaveTextContent("A")
    expect(screen.getByRole("link", { name: "Open Treatment Evidence Network" })).toHaveAttribute("href", "https://prototype.dfda.earth")
    expect(screen.getByRole("link", { name: "For companies" })).toHaveAttribute("href", "/instances/new")
  })
})
