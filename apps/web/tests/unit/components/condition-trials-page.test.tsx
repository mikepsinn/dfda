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
const params = (globalVariableId: string) => Promise.resolve({ globalVariableId });
const depression = { id: "major-depressive-disorder", name: "Major depressive disorder", description: null, emoji: null };
const searchUrl = registrySearchUrl(depression.name);
const registryTrial: RegistryTrial = {
  nctId: "NCT06392867",
  title: "Theta-burst Stimulation for Major Depression",
  studyType: "INTERVENTIONAL",
  phases: ["PHASE2"],
  sponsor: "The Hong Kong Polytechnic University",
  interventions: ["iTBS", "Sham iTBS", "Escitalopram", "Placebo"],
  locations: ["Hong Kong, Hong Kong", "Boston, United States"],
  url: "https://clinicaltrials.gov/study/NCT06392867",
};

beforeEach(() => {
  vi.clearAllMocks();
  getRegistry.mockResolvedValue({ ok: true, total: 0, trials: [], searchUrl });
});
afterEach(cleanup);

describe("condition trials page", () => {
  it("looks the condition up by the id in the URL and links each trial to its details page", async () => {
    getCondition.mockResolvedValue(depression);
    getTrials.mockResolvedValue([
      { id: "trial-1", title: "Ketamine for depression", description: "A pragmatic trial.", phase: "Phase 2", research_partner_name: "Example Sponsor" },
    ] as Awaited<ReturnType<typeof getTrialsByConditionAction>>);

    render(await ConditionTrialsPage({ params: params("major-depressive-disorder") }));

    expect(getCondition).toHaveBeenCalledWith("major-depressive-disorder");
    expect(getTrials).toHaveBeenCalledWith("major-depressive-disorder");
    expect(getRegistry).toHaveBeenCalledWith("Major depressive disorder");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Major depressive disorder");
    expect(screen.getByRole("heading", { level: 2, name: /^Trials on / })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute("href", "/patient/trial-details/trial-1");
  });

  it("returns not found for an unknown condition without querying trials", async () => {
    getCondition.mockResolvedValue(null);

    await expect(ConditionTrialsPage({ params: params("not-a-condition") })).rejects.toThrow("NOT_FOUND");
    expect(getTrials).not.toHaveBeenCalled();
    expect(getRegistry).not.toHaveBeenCalled();
  });

  it("lists recruiting registry studies when the site hosts no trials for the condition", async () => {
    getCondition.mockResolvedValue(depression);
    getTrials.mockResolvedValue([]);
    getRegistry.mockResolvedValue({ ok: true, total: 458, trials: [registryTrial], searchUrl });

    render(await ConditionTrialsPage({ params: params("major-depressive-disorder") }));

    expect(screen.queryByRole("heading", { name: /^Trials on / })).not.toBeInTheDocument();
    expect(screen.queryByText("No Trials Found")).not.toBeInTheDocument();
    expect(screen.getByText("The 1 most relevant of 458 recruiting studies.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(registryTrial.title);
    expect(screen.getByText("Phase 2")).toBeInTheDocument();
    expect(screen.getByText("iTBS, Sham iTBS, Escitalopram and 1 more")).toBeInTheDocument();
    expect(screen.getByText("Hong Kong, Hong Kong and 1 more location")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on ClinicalTrials.gov/ })).toHaveAttribute("href", registryTrial.url);
    expect(screen.getByRole("link", { name: /See all 458 on ClinicalTrials.gov/ })).toHaveAttribute("href", searchUrl);
  });

  it("says when the registry has no recruiting studies", async () => {
    getCondition.mockResolvedValue(depression);
    getTrials.mockResolvedValue([]);

    render(await ConditionTrialsPage({ params: params("major-depressive-disorder") }));

    expect(screen.getByText("ClinicalTrials.gov lists no recruiting studies for Major depressive disorder.")).toBeInTheDocument();
  });

  it("links to the registry search when ClinicalTrials.gov does not respond", async () => {
    getCondition.mockResolvedValue(depression);
    getTrials.mockResolvedValue([]);
    getRegistry.mockResolvedValue({ ok: false, searchUrl });

    render(await ConditionTrialsPage({ params: params("major-depressive-disorder") }));

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
