import { readdirSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Home from "@/app/page";
import { getConditionEstimate, outcomeLabelHref, rankTreatments } from "@/lib/demo/treatment-estimates";

afterEach(cleanup);

// Every app route with a page, as a pattern: route groups removed, dynamic segments as wildcards.
function pageRoutes(dir = path.join(process.cwd(), "app"), prefix = ""): RegExp[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isFile()) {
      return entry.name === "page.tsx" ? [new RegExp(`^${prefix || "/"}$`)] : [];
    }
    if (!entry.isDirectory()) return [];
    const segment = /^\(.*\)$/.test(entry.name) ? "" : entry.name.startsWith("[") ? "/[^/]+" : `/${entry.name}`;
    return pageRoutes(path.join(dir, entry.name), prefix + segment);
  });
}

describe("landing page", () => {
  it("presents the framework without invented testimonials, metrics or claims", async () => {
    render(await Home());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Decentralized Framework for Drug Assessment");
    expect(screen.getByText("Planned architecture")).toBeInTheDocument();
    for (const removed of [/FDA v2/, /Testimonial/, /Success Metrics/, /Trusted by/, /Join thousands/, /Join Trial/, /245 trials/]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument();
    }
  });

  it("previews snapshot rankings with estimate labels and switches between example conditions", async () => {
    const user = userEvent.setup();
    render(await Home());
    expect(screen.getByText("Current best estimates")).toBeInTheDocument();

    const depression = (await getConditionEstimate("depression"))!;
    const expected = rankTreatments(depression.treatments, "effectiveness").slice(0, 5);
    let list = screen.getByRole("list", { name: /Top Depression treatments/ });
    expect(within(list).getAllByRole("heading", { level: 3 }).map(item => item.textContent))
      .toEqual(expected.map(treatment => treatment.name));
    expect(within(list).getAllByRole("link").map(link => link.getAttribute("href")))
      .toEqual(expected.map(treatment => outcomeLabelHref("depression", treatment.slug)));

    await user.click(screen.getByRole("button", { name: "Insomnia" }));
    expect(screen.getByRole("button", { name: "Insomnia" })).toHaveAttribute("aria-pressed", "true");
    list = screen.getByRole("list", { name: /Top Insomnia treatments/ });
    expect(within(list).getAllByRole("link")[0].getAttribute("href")).toMatch(/^\/outcome-labels\/demo\/insomnia\//);
    expect(screen.getByRole("link", { name: /All Insomnia rankings/ })).toHaveAttribute("href", "/treatment-rankings?condition=insomnia");
  });

  it("shows the source-backed example label and marks every mock-up as example data", async () => {
    render(await Home());
    expect(screen.getByText("Suvorexant")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /posted trial result \(NCT01097616\)/ }))
      .toHaveAttribute("href", "/outcome-labels/demo/insomnia/suvorexant#trial-results");
    // 7 patient, 3 provider and 5 research-partner steps.
    expect(screen.getAllByText("Example data")).toHaveLength(15);
  });

  it("links only to existing routes and to anchors that exist on the page", async () => {
    const { container } = render(await Home());
    const routes = pageRoutes();
    const hrefs = [...container.querySelectorAll("a[href]")].map(link => link.getAttribute("href")!);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      const url = new URL(href, "http://localhost");
      expect(routes.some(route => route.test(url.pathname)), href).toBe(true);
      if (url.pathname === "/" && url.hash) {
        expect(container.querySelector(url.hash), href).not.toBeNull();
      }
    }
    expect(container.querySelector("form[action='/treatment-rankings']")).not.toBeNull();
  });
});
