import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ImpactPage from "@/app/(public)/impact/page";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import {
  impactSources,
  modelEstimates,
  pragmaticCostReview,
  problemFigures,
  recoveryFigures,
} from "@/lib/impact/pragmatic-trial-impact";

afterEach(cleanup);

describe("impact page", () => {
  it("presents universal pragmatic trials as a goal, not as results of this network", () => {
    render(<ImpactPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Impact of Universal Pragmatic Trials");
    expect(screen.getByText(/has no\s+results of its own yet/)).toBeInTheDocument();
    expect(screen.getByText(/These are model estimates from/)).toHaveTextContent("not results");
    for (const removed of [/750/, /our impact/i, /49,000/, /186 hospitals/, /Lessons from RECOVERY/]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument();
    }
  });

  it("cites a listed source for every figure, and lists only cited sources", () => {
    render(<ImpactPage />);
    const figures = [...problemFigures, ...recoveryFigures, pragmaticCostReview, ...modelEstimates];
    const cited = new Set(figures.flatMap(figure => figure.sourceIds));
    expect([...cited].sort()).toEqual(impactSources.map(source => source.id).sort());

    const sources = within(screen.getByRole("list", { name: "Sources" })).getAllByRole("link");
    expect(sources.map(link => link.getAttribute("href"))).toEqual(impactSources.map(source => source.url));
    for (const [index] of impactSources.entries()) {
      expect(screen.getAllByRole("link", { name: `Source ${index + 1}` })[0]).toHaveAttribute("href", `#source-${index + 1}`);
    }
  });

  it("shows a range for every model estimate", () => {
    render(<ImpactPage />);
    const estimates = within(screen.getByRole("list", { name: "Model estimates" })).getAllByRole("listitem");
    expect(estimates).toHaveLength(modelEstimates.length);
    for (const item of estimates) expect(item).toHaveTextContent(/90% range: /);
  });

  it("is linked from the landing page as potential impact", () => {
    render(<KeyBenefitsSection />);
    expect(screen.getByRole("link", { name: /See the potential impact/ })).toHaveAttribute("href", "/impact");
  });
});
