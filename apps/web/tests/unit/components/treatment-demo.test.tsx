import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RankingsPage from "@/app/(public)/treatment-rankings/page";
import LabelPage from "@/app/(public)/outcome-labels/demo/[conditionSlug]/[treatmentSlug]/page";
import { getConditionEstimate } from "@/lib/demo/treatment-estimates";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
afterEach(cleanup);

describe("imported treatment demo pages", () => {
  it("renders rankings with concise estimate labels and working label paths", async () => {
    render(await RankingsPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: "Treatment rankings" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Current best estimate/)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /View Outcome Label/ }),
    ).toHaveLength(6);
    expect(screen.getByRole("combobox", { name: "Condition" })).toHaveTextContent("Depression");
    expect(document.querySelector('input[name="condition"]')).toHaveValue("depression");
    expect(screen.getByText(/not response percentages/)).toBeInTheDocument();
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
  });
  it("keeps unknown conditions explicit instead of silently displaying depression", async () => {
    render(
      await RankingsPage({
        searchParams: Promise.resolve({ condition: "unknown" }),
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No imported estimates",
    );
    expect(
      screen.queryByRole("link", { name: /View Outcome Label/ }),
    ).not.toBeInTheDocument();
  });
  it("shows outcome and side-effect estimates separately from trial discovery", async () => {
    const condition = (await getConditionEstimate("depression"))!;
    const treatment = condition.treatments[0];
    render(
      await LabelPage({
        params: Promise.resolve({
          conditionSlug: condition.slug,
          treatmentSlug: treatment.slug,
        }),
      }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      treatment.name,
    );
    expect(screen.getAllByText("-68%")).toHaveLength(2);
    expect(screen.getByText('Estimated frequency.')).toBeInTheDocument();
    expect(screen.getByText('Current best estimates')).toBeInTheDocument();
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Origin and limitations')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /original Optimitron/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Search ClinicalTrials.gov/ }),
    ).toHaveAttribute("href", expect.stringContaining("cond=Depression"));
  });
  it("does not substitute a different treatment for an unknown label", async () => {
    await expect(
      LabelPage({
        params: Promise.resolve({
          conditionSlug: "depression",
          treatmentSlug: "unknown",
        }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
  it("shows the posted trial result separately from provisional scores", async () => {
    render(await LabelPage({ params: Promise.resolve({ conditionSlug: "insomnia", treatmentSlug: "suvorexant" }) }));
    expect(screen.getByRole("heading", { name: "Reported trial result" })).toBeInTheDocument();
    expect(screen.getByText("10.7 more minutes of sleep vs placebo")).toBeInTheDocument();
    expect(screen.getByText(/95% confidence interval: 1.9 to 19.5 minutes/)).toBeInTheDocument();
    expect(screen.getByText("228 participants analyzed")).toBeInTheDocument();
    expect(screen.getByText("339 participants analyzed")).toBeInTheDocument();
    expect(screen.getByText(/Secondary endpoint/)).toBeInTheDocument();
    expect(screen.getByText("Current best estimates")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cost estimates" })).toBeInTheDocument();
    expect(screen.getByText("$2,200")).toBeInTheDocument();
    expect(screen.getByText("10-20 mg at bedtime")).toBeInTheDocument();
    expect(document.querySelector("article a button")).toBeNull();
    expect(screen.getByRole("link", { name: /View posted results/ }))
      .toHaveAttribute("href", "https://clinicaltrials.gov/study/NCT01097616?tab=results");
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
  });
  it("links the insomnia ranking to its available trial comparison", async () => {
    render(await RankingsPage({ searchParams: Promise.resolve({ condition: "insomnia" }) }));
    expect(screen.getAllByRole("link", { name: "Posted trial comparison available" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Posted trial comparison available" }))
      .toHaveAttribute("href", "/outcome-labels/demo/insomnia/suvorexant#trial-results");
  });
  it("renders a newly imported condition and its Outcome Label", async () => {
    const condition = (await getConditionEstimate("acne"))!;
    render(await RankingsPage({ searchParams: Promise.resolve({ condition: condition.slug }) }));
    expect(screen.getByRole("heading", { name: `Acne: ${condition.treatments.length} treatment estimates` })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View Outcome Label/ })).toHaveLength(condition.treatments.length);
    cleanup();
    render(await LabelPage({ params: Promise.resolve({ conditionSlug: condition.slug, treatmentSlug: condition.treatments[0].slug }) }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(condition.treatments[0].name);
    expect(screen.getByText("Current best estimates")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reported trial result" })).not.toBeInTheDocument();
  });
});
