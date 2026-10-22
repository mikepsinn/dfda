import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { MarkdownContent } from "@/components/instance/MarkdownContent"
import { pageInputSchema, pagePath } from "@/lib/instance/pages"

afterEach(cleanup)

const input = { title: "What we measure", slug: "what-we-measure", body: "## Markers", inMenu: true }

describe("a company's content page", () => {
  it("takes a title, an address in lowercase with single hyphens, and a text", () => {
    expect(pageInputSchema.parse({ ...input, title: "  What we measure ", slug: " What-We-Measure " })).toEqual(input)
    for (const slug of ["what we measure", "what--we", "-faq", "faq-", "", "a".repeat(61)]) {
      expect(pageInputSchema.safeParse({ ...input, slug }).success, slug).toBe(false)
    }
    expect(pageInputSchema.safeParse({ ...input, title: " " }).success).toBe(false)
    expect(pageInputSchema.safeParse({ ...input, body: "  " }).success).toBe(false)
    expect(pageInputSchema.safeParse({ ...input, body: "x".repeat(50_001) }).success).toBe(false)
  })

  it("is at /pages/{address}, or at /terms or /privacy for the company's own legal pages", () => {
    expect(pagePath("faq")).toBe("/pages/faq")
    expect(pagePath("terms")).toBe("/terms")
    expect(pagePath("privacy")).toBe("/privacy")
  })

  it("shows its Markdown text with headings, lists, links and tables", () => {
    render(
      <MarkdownContent>
        {[
          "# Organs",
          "",
          "We measure **4,000 proteins**. See [the method](https://example.com/method).",
          "",
          "- Heart",
          "- Liver",
          "",
          "| Organ | Markers |",
          "| --- | --- |",
          "| Heart | NT-proBNP, TNNT2 |",
        ].join("\n")}
      </MarkdownContent>,
    )
    // The page title is the page's only h1, so the text's top heading is an h2.
    expect(screen.getByRole("heading", { level: 2, name: "Organs" })).toBeInTheDocument()
    expect(screen.getByText("4,000 proteins").tagName).toBe("STRONG")
    expect(screen.getByRole("link", { name: "the method" })).toHaveAttribute("href", "https://example.com/method")
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Heart", "Liver"])
    const table = screen.getByRole("table")
    expect(within(table).getByRole("columnheader", { name: "Markers" })).toBeInTheDocument()
    expect(within(table).getByRole("cell", { name: "NT-proBNP, TNNT2" })).toBeInTheDocument()
    expect(table).not.toHaveAttribute("node")
  })

  it("does not render raw HTML or links that run scripts", () => {
    const { container } = render(
      <MarkdownContent>
        {[
          "<script>alert(1)</script>",
          "",
          'Text <img src="x" onerror="alert(1)"> and <a href="https://example.com">a tag</a>.',
          "",
          "[Click](javascript:alert(1))",
        ].join("\n")}
      </MarkdownContent>,
    )
    expect(container.querySelector("script, img, [onerror]")).toBeNull()
    expect(container.querySelector('a[href^="javascript"]')).toBeNull()
    expect(screen.queryByRole("link", { name: "a tag" })).not.toBeInTheDocument()
  })
})
