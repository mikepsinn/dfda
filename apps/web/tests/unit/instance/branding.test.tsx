import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Footer } from "@/components/Footer"
import { HeroSection } from "@/components/HeroSection"
import { InstanceFooter } from "@/components/instance/InstanceFooter"
import { InstanceHeader } from "@/components/instance/InstanceHeader"
import { InstanceHome } from "@/components/instance/InstanceHome"
import type { Program } from "@/lib/programs/data"

vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: vi.fn() } }))
vi.mock("@/lib/actions/profiles", () => ({ updateUserProfileTimezoneAction: vi.fn() }))

afterEach(cleanup)

const instance = { name: "Acme Proteomics", tagline: "Track your peptides.", products: ["BPC-157", "Proteomics panel"] }
const program = (id: string, slug: string, name: string): Program => ({
  id,
  slug,
  name,
  summary: null,
  followUpWeeks: 12,
  instanceId: "instance-1",
  items: [],
})

describe("a company instance's own site", () => {
  it("has a home page with the company, its programs and how a program works, and no network pages", () => {
    const { container } = render(
      <InstanceHome
        instance={instance}
        programs={[program("p1", "bpc-157", "BPC-157 recovery program"), program("p2", "glp-1", "GLP-1 weight program")]}
        joined={new Set(["p2"])}
      />,
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Acme Proteomics")
    expect(screen.getByText("Track your peptides.")).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Products" })).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["BPC-157", "Proteomics panel"])
    expect(screen.getByRole("link", { name: /BPC-157 recovery program/ })).toHaveAttribute("href", "/programs/bpc-157")
    // A program the person joined opens their own program page.
    expect(screen.getByRole("link", { name: /GLP-1 weight program.*You joined.*Open your program/ })).toHaveAttribute("href", "/programs/glp-1/me")
    expect(screen.getByRole("heading", { name: "How a program works" })).toBeInTheDocument()
    expect(screen.getByText(/Acme Proteomics sees totals only/)).toBeInTheDocument()
    const hrefs = [...container.querySelectorAll("a")].map((link) => link.getAttribute("href"))
    expect(hrefs.every((href) => href === "#programs" || href?.startsWith("/programs/"))).toBe(true)
  })

  it("leaves out the programs part when there are no programs", () => {
    render(<InstanceHome instance={{ ...instance, tagline: null, products: [] }} programs={[]} joined={new Set()} />)
    expect(screen.queryByRole("heading", { name: "Programs" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /See the programs/ })).not.toBeInTheDocument()
  })

  it("has a header with the company's name, its programs and sign-in", () => {
    render(<InstanceHeader brand={{ name: "Acme Proteomics", logoUrl: null }} initialUser={null} initialProfile={null} />)
    const header = screen.getByRole("banner")
    expect(within(header).getByRole("link", { name: /Acme Proteomics/ })).toHaveAttribute("href", "/")
    expect(within(header).getByRole("link", { name: "Programs" })).toHaveAttribute("href", "/programs")
    expect(within(header).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login")
    expect(within(header).getAllByRole("link")).toHaveLength(3)
  })

  it("has a footer that names the network that runs it, with the company's letter as its logo", () => {
    const { container } = render(
      <InstanceFooter
        brand={{ name: "Acme Proteomics", logoUrl: null }}
        network={{ name: "Open Treatment Evidence Network", url: "https://prototype.dfda.earth" }}
      />,
    )
    expect(container.querySelector("footer span[aria-hidden='true']")).toHaveTextContent("A")
    expect(screen.getByText(/© \d{4} Acme Proteomics/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open Treatment Evidence Network" })).toHaveAttribute("href", "https://prototype.dfda.earth")
    expect(screen.queryByRole("link", { name: "For companies" })).not.toBeInTheDocument()
  })
})

describe("the network's site", () => {
  it("keeps its hero and footer", () => {
    render(
      <>
        <HeroSection />
        <Footer siteName="Open Treatment Evidence Network" />
      </>,
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Open Treatment Evidence Network")
    expect(screen.getByRole("link", { name: /Compare treatments/ })).toHaveAttribute("href", "/treatment-rankings")
    expect(screen.getByRole("link", { name: "For companies" })).toHaveAttribute("href", "/instances/new")
    expect(screen.queryByText(/Powered by/)).not.toBeInTheDocument()
  })
})
