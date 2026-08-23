jest.mock("@/config/navigation/shared-links", () => ({
  commonLinks: {
    contributeOnGithub: {
      title: "Contribute on GitHub",
      href: "https://github.com/decentralized-fda/decentralized-fda",
      external: true,
    },
    reportBug: { title: "Report a Bug", href: "/bug-report" },
    requestFeature: { title: "Request a Feature", href: "/feature-request" },
  },
}))

import { dfdaNavigation } from "@/config/navigation/domains/dfda-nav"

describe("Decentralized FDA navigation", () => {
  it("keeps the main research destinations visible in a predictable order", () => {
    expect(
      dfdaNavigation.topNav.map(({ title, href }) => ({ title, href }))
    ).toEqual([
      { title: "Home", href: "/" },
      { title: "Conditions", href: "/conditions" },
      { title: "Treatments", href: "/treatments" },
      { title: "Variables", href: "/variables" },
      { title: "Studies", href: "/studies" },
      { title: "Trials", href: "/trials" },
    ])
  })

  it("does not repeat destinations between the main and explore menus", () => {
    const allItems = [
      ...dfdaNavigation.topNav,
      ...(dfdaNavigation.exploreNav ?? []),
    ]
    const hrefs = allItems.map((item) => item.href)

    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it("marks off-site explore destinations as external", () => {
    const offSiteItems = (dfdaNavigation.exploreNav ?? []).filter((item) =>
      item.href.startsWith("http")
    )

    expect(offSiteItems.length).toBeGreaterThan(0)
    expect(offSiteItems.every((item) => item.external)).toBe(true)
  })

  it("always advertises API-backed research destinations", () => {
    const hrefs = dfdaNavigation.topNav.map((item) => item.href)

    expect(hrefs).toEqual(
      expect.arrayContaining(["/variables", "/studies"])
    )
  })
})
