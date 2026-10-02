import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConditionTrialsPage from "@/app/(public)/conditions/[globalVariableId]/trials/page";
import { getGlobalConditionByIdAction } from "@/lib/actions/conditions";
import { getTrialsByConditionAction } from "@/lib/actions/trials";
import { getRecruitingRegistryTrials, registrySearchUrl, type RegistryTrial } from "@/lib/trials/registry-trials";
import { createClient } from "@/utils/supabase/server";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/actions/conditions", () => ({ getGlobalConditionByIdAction: vi.fn() }));
vi.mock("@/lib/actions/trials", () => ({ getTrialsByConditionAction: vi.fn() }));
vi.mock("@/lib/trials/registry-trials", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/trials/registry-trials")>()),
  getRecruitingRegistryTrials: vi.fn(),
}));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));

const getCondition = vi.mocked(getGlobalConditionByIdAction);
const getTrials = vi.mocked(getTrialsByConditionAction);
const getRegistry = vi.mocked(getRecruitingRegistryTrials);
const basePath = "/conditions/major-depressive-disorder/trials";
const depression = { id: "major-depressive-disorder", name: "Major depressive disorder", description: null, emoji: null };
const searchUrl = registrySearchUrl(depression.name);
const registryTrial: RegistryTrial = {
  nctId: "NCT06392867",
  title: "Theta-burst Stimulation for Major Depression",
  summary: "Daily stimulation for four weeks. ".repeat(10).trim(),
  status: "RECRUITING",
  startDate: "2024-01-08",
  studyType: "INTERVENTIONAL",
  phases: ["PHASE2"],
  sponsor: "The Hong Kong Polytechnic University",
  interventions: ["iTBS", "Sham iTBS"],
  locations: ["Hong Kong, Hong Kong", "Boston, United States"],
  url: "https://clinicaltrials.gov/study/NCT06392867",
};
const registryPage = (overrides: Partial<Extract<Awaited<ReturnType<typeof getRecruitingRegistryTrials>>, { ok: true }>> = {}) => ({
  ok: true as const,
  total: 458,
  trials: [registryTrial],
  searchUrl,
  nextPageToken: "NextToken2",
  paginationReset: false,
  ...overrides,
});
const renderPage = async (query: Record<string, string | string[]> = {}, id = "major-depressive-disorder") =>
  render(await ConditionTrialsPage({ params: Promise.resolve({ globalVariableId: id }), searchParams: Promise.resolve(query) }));

beforeEach(() => {
  vi.clearAllMocks();
  getCondition.mockResolvedValue(depression);
  getTrials.mockResolvedValue([]);
  getRegistry.mockResolvedValue(registryPage({ total: 0, trials: [], nextPageToken: null }));
});
afterEach(cleanup);

describe("condition trials page", () => {
  it("looks the condition up by the id in the URL and links each hosted trial to its details page", async () => {
    getTrials.mockResolvedValue([
      { id: "trial-1", title: "Ketamine for depression", description: "A pragmatic trial.", phase: "Phase 2", research_partner_name: "Example Sponsor" },
    ] as Awaited<ReturnType<typeof getTrialsByConditionAction>>);

    await renderPage();

    expect(getCondition).toHaveBeenCalledWith("major-depressive-disorder");
    expect(getTrials).toHaveBeenCalledWith("major-depressive-disorder");
    expect(getRegistry).toHaveBeenCalledWith("Major depressive disorder", { pageToken: undefined });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Major depressive disorder");
    expect(screen.getByRole("heading", { level: 2, name: /^Trials on / })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute("href", "/patient/trial-details/trial-1");
  });

  it("returns not found for an unknown condition without querying trials", async () => {
    getCondition.mockResolvedValue(null);

    await expect(renderPage({}, "not-a-condition")).rejects.toThrow("NOT_FOUND");
    expect(getTrials).not.toHaveBeenCalled();
    expect(getRegistry).not.toHaveBeenCalled();
  });

  it("shows each registry study with its status, details, treatments and registry link", async () => {
    getRegistry.mockResolvedValue(registryPage());

    await renderPage();

    expect(screen.queryByRole("heading", { name: /^Trials on / })).not.toBeInTheDocument();
    expect(screen.getByText("recruiting studies on", { exact: false })).toHaveTextContent("458 recruiting studies on ClinicalTrials.gov");
    expect(screen.getByText("Showing 1–1 of 458 recruiting studies, most relevant first.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(registryTrial.title);
    expect(screen.getByText("Recruiting")).toBeInTheDocument();
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
    expect(screen.getByText("Jan 8, 2024")).toBeInTheDocument();
    expect(screen.getByText("Hong Kong, Hong Kong and 1 more")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Treatments being tested" })).toBeInTheDocument();
    expect(screen.getByText("iTBS")).toBeInTheDocument();
    expect(screen.getByText("Sham iTBS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show more" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: /Learn more and join/ })).toHaveAttribute("href", registryTrial.url);
    expect(screen.getByRole("link", { name: /Search and filter all of them/ })).toHaveAttribute("href", searchUrl);
    expect(screen.getByText(/we have not reviewed these studies/)).toBeInTheDocument();
  });

  it("pages forward with the registry cursor and back to the first page", async () => {
    getRegistry.mockResolvedValue(registryPage());
    await renderPage();

    expect(screen.getByText("Page 1 of 46")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", `${basePath}?page=2&pageToken=NextToken2&total=458`);
    cleanup();

    // Later pages do not report a total, so the page link carries the first page's.
    getRegistry.mockResolvedValue(registryPage({ total: null, nextPageToken: null }));
    await renderPage({ page: "2", pageToken: "NextToken2", total: "458" });

    expect(getRegistry).toHaveBeenLastCalledWith("Major depressive disorder", { pageToken: "NextToken2" });
    expect(getTrials).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Showing 11–11 of 458 recruiting studies, most relevant first.")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 46")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "First page" })).toHaveAttribute("href", basePath);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("leaves the total out when a later page does not carry a usable one", async () => {
    getRegistry.mockResolvedValue(registryPage({ total: null }));

    await renderPage({ page: "3", pageToken: "NextToken3", total: "lots" });

    expect(screen.getByText("Showing 21–21 recruiting studies, most relevant first.")).toBeInTheDocument();
    expect(screen.getByText("Page 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", `${basePath}?page=4&pageToken=NextToken2`);
    expect(screen.queryByText(/recruiting studies on/)).not.toBeInTheDocument();
  });

  it("says when an expired page was replaced by the first page", async () => {
    getRegistry.mockResolvedValue(registryPage({ paginationReset: true }));

    await renderPage({ page: "5", pageToken: "Expired" });

    expect(screen.getByRole("status")).toHaveTextContent("That results page has expired.");
    expect(screen.getByText("Page 1 of 46")).toBeInTheDocument();
  });

  it("treats a cursor that is not a registry token as the first page", async () => {
    await renderPage({ page: "3", pageToken: "a&b=c" });

    expect(getRegistry).toHaveBeenCalledWith("Major depressive disorder", { pageToken: undefined });
    expect(getTrials).toHaveBeenCalled();
  });

  it("says when the registry has no recruiting studies", async () => {
    await renderPage();

    expect(screen.getByText("ClinicalTrials.gov lists no recruiting studies for Major depressive disorder.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Result pages" })).not.toBeInTheDocument();
  });

  it("links to the registry search when ClinicalTrials.gov does not respond", async () => {
    getRegistry.mockResolvedValue({ ok: false, searchUrl });

    await renderPage();

    expect(screen.getByText(/ClinicalTrials.gov did not respond/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search ClinicalTrials.gov for Major depressive disorder/ }))
      .toHaveAttribute("href", searchUrl);
  });

});

describe("getTrialsByConditionAction", () => {
  it("queries the recruiting trials that public visitors are allowed to read", async () => {
    const filters: [string, unknown][] = [];
    const query = {
      select: () => query,
      eq(column: string, value: unknown) {
        filters.push([column, value]);
        return filters.length === 2 ? Promise.resolve({ data: [], error: null }) : query;
      },
    };
    vi.mocked(createClient).mockResolvedValue({ from: () => query } as unknown as Awaited<ReturnType<typeof createClient>>);
    const { getTrialsByConditionAction: queryTrials } =
      await vi.importActual<typeof import("@/lib/actions/trials")>("@/lib/actions/trials");

    await expect(queryTrials("major-depressive-disorder")).resolves.toEqual([]);
    expect(filters).toEqual([["condition_id", "major-depressive-disorder"], ["status", "recruiting"]]);
  });
});
