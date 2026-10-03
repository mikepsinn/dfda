import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ConditionPicker } from "@/components/demo/condition-picker";
import { EstimateNotice } from "@/components/demo/estimate-notice";
import { HealthEconomics } from "@/components/demo/health-economics";
import { TreatmentOutcomes, hasCitedValues } from "@/components/demo/treatment-outcomes";
import { OutcomeLabel } from "@/components/OutcomeLabel";
import { citedSource, conditionCatalog, getConditionEstimate } from "@/lib/demo/treatment-estimates";
import { formatEstimatedCost } from "@/lib/demo/format-estimate";

const originalScroll = Element.prototype.scrollIntoView;
beforeAll(() => {
  // JSDOM has no layout engine; cmdk uses these browser APIs to size/scroll its list.
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
afterAll(() => {
  vi.unstubAllGlobals();
  Element.prototype.scrollIntoView = originalScroll;
});

describe("treatment presentation", () => {
  it("searches all conditions, recognizes synonyms and preserves a GET form value", async () => {
    const user = userEvent.setup();
    render(<form><ConditionPicker conditions={conditionCatalog} initialValue="insomnia" /></form>);
    await user.click(screen.getByRole("combobox", { name: "Condition" }));
    expect(screen.getAllByRole("option")).toHaveLength(216);
    const search = screen.getByRole("combobox", { name: "Search conditions" });
    const depression = conditionCatalog.find(condition => condition.slug === "depression")!;
    await user.type(search, depression.synonyms[0]);
    expect(screen.getByRole("option", { name: "Depression" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Depression" }));
    expect(screen.getByRole("combobox", { name: "Condition" })).toHaveTextContent("Depression");
    expect(new FormData(document.querySelector("form")!).get("condition")).toBe("depression");
  });
  it("shows an empty search and allows keyboard selection without submitting the form", async () => {
    const user = userEvent.setup();
    const submit = vi.fn(event => event.preventDefault());
    render(<form onSubmit={submit}><ConditionPicker conditions={conditionCatalog} initialValue="insomnia" /></form>);
    await user.click(screen.getByRole("combobox", { name: "Condition" }));
    const search = screen.getByRole("combobox", { name: "Search conditions" });
    await user.type(search, "zzzzno-match");
    expect(screen.getByText("No matching conditions.")).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "acne");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("combobox", { name: "Condition" })).toHaveTextContent("Acne");
    expect(submit).not.toHaveBeenCalled();
  });
  it("keeps missing costs distinct from zero and preserves signed differences", () => {
    expect(formatEstimatedCost(0)).toBe("$0");
    expect(formatEstimatedCost(null)).toBe("Not available");
    expect(formatEstimatedCost(undefined)).toBe("Not available");
    expect(formatEstimatedCost(NaN)).toBe("Not available");
    expect(formatEstimatedCost(-1500)).toBe("-$1,500");
    render(<HealthEconomics economics={null} />);
    expect(screen.getByText("Not available")).toBeInTheDocument();
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
  });
  it("shows zero-valued estimates and only shows ICER with a named comparator", () => {
    const economics = { annualCostOfCare: { totalAnnual: 0, drugCost: 0 }, icer: -5000, costPerResponder: 0 };
    const { rerender } = render(<HealthEconomics economics={economics} />);
    expect(screen.getAllByText("$0")).toHaveLength(3);
    expect(screen.queryByText(/Incremental cost/)).not.toBeInTheDocument();
    rerender(<HealthEconomics economics={{ ...economics, vsComparator: { comparatorName: "Placebo", costDifference: -100 } }} />);
    expect(screen.getByText("Placebo")).toBeInTheDocument();
    expect(screen.getByText("-$100")).toBeInTheDocument();
    expect(screen.getByText("-$5,000")).toBeInTheDocument();
    expect(screen.queryByText(/excellent|dominates/i)).not.toBeInTheDocument();
  });
  it("preserves change signs, frequency semantics, missing values and changes above 100%", () => {
    render(<OutcomeLabel title="Test label" showBars={false} data={[{ title: "Outcomes", items: [
      { name: "No estimate", value: { percentage: null } },
      { name: "No change", value: { percentage: 0 } },
      { name: "Increase", value: { percentage: 150 } },
      { name: "Frequency", value: { percentage: 10, kind: "frequency" } },
      { name: "Absolute only", value: { percentage: null, absolute: "-0.78 pg/mL compared with placebo" } },
    ] }]} />);
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByText("-0.78 pg/mL compared with placebo")).toBeInTheDocument();
    expect(screen.queryByText("(-0.78 pg/mL compared with placebo)")).not.toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("+150%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.queryByText("+10%")).not.toBeInTheDocument();
  });
  it("links values taken from a cited source and leaves estimates unlinked", async () => {
    expect(citedSource({ dataSource: "ai-estimated", sourceUrl: "https://example.org" })).toBeNull();
    expect(citedSource({ dataSource: "fda-label", sourceUrl: "https://vertexaisearch.cloud.google.com/x" })).toBeNull();
    const { treatments } = (await getConditionEstimate("alzheimers-disease"))!;
    const lecanemab = treatments.find(t => t.slug === "lecanemab")!;
    expect(hasCitedValues(lecanemab)).toBe(true);
    expect(hasCitedValues(treatments.find(t => t.slug === "donanemab")!)).toBe(false);

    render(<TreatmentOutcomes treatment={lecanemab} />);
    const links = screen.getAllByRole("link", { name: /^Source:/ });
    expect(links).toHaveLength(10);
    expect(links.filter(link => link.textContent?.startsWith("Source: FDA label"))).toHaveLength(9);
    expect(screen.getByRole("link", { name: /^Source: Published study/ }))
      .toHaveAttribute("href", "https://doi.org/10.1056/NEJMoa2212948");
    expect(screen.getByText("Frequency, from the cited source where one is shown.")).toBeInTheDocument();

    cleanup();
    render(<EstimateNotice cited />);
    expect(screen.getByText(/Values marked with a source are taken from it\./)).toBeInTheDocument();
  });
});
