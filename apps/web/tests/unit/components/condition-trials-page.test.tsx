import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConditionTrialsPage from "@/app/(public)/conditions/[globalVariableId]/trials/page";
import { getGlobalConditionByIdAction } from "@/lib/actions/conditions";
import { getTrialsByConditionAction } from "@/lib/actions/trials";
import { createClient } from "@/utils/supabase/server";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/actions/conditions", () => ({ getGlobalConditionByIdAction: vi.fn() }));
vi.mock("@/lib/actions/trials", () => ({ getTrialsByConditionAction: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));

const getCondition = vi.mocked(getGlobalConditionByIdAction);
const getTrials = vi.mocked(getTrialsByConditionAction);
const params = (globalVariableId: string) => Promise.resolve({ globalVariableId });
const depression = { id: "major-depressive-disorder", name: "Major depressive disorder", description: null, emoji: null };

beforeEach(() => vi.clearAllMocks());
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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Major depressive disorder");
    expect(screen.getByRole("link", { name: "View Details" })).toHaveAttribute("href", "/patient/trial-details/trial-1");
  });

  it("returns not found for an unknown condition without querying trials", async () => {
    getCondition.mockResolvedValue(null);

    await expect(ConditionTrialsPage({ params: params("not-a-condition") })).rejects.toThrow("NOT_FOUND");
    expect(getTrials).not.toHaveBeenCalled();
  });

  it("shows an empty state when the condition has no recruiting trials", async () => {
    getCondition.mockResolvedValue(depression);
    getTrials.mockResolvedValue([]);

    render(await ConditionTrialsPage({ params: params("major-depressive-disorder") }));

    expect(screen.getByText("No Trials Found")).toBeInTheDocument();
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
