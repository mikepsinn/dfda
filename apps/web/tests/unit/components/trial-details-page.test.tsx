import { existsSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrialDetailsPage from "@/app/(public)/patient/trial-details/[id]/page";
import { getTrialDetailsAction, type TrialDetails } from "@/lib/actions/trials";
import { getTrialEnrollmentStatusAction } from "@/lib/actions/trial-enrollments";
import { getServerUser } from "@/lib/server-auth";
import { getUserDb } from "@/lib/db/server";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/actions/trials", () => ({ getTrialDetailsAction: vi.fn() }));
vi.mock("@/lib/actions/trial-enrollments", () => ({
  getTrialEnrollmentStatusAction: vi.fn(),
  createInitialEnrollmentAction: vi.fn(),
}));
vi.mock("@/lib/server-auth", () => ({ getServerUser: vi.fn() }));
vi.mock("@/lib/db/server", () => ({ getUserDb: vi.fn() }));
vi.mock("@/utils/supabase/client", () => ({ createClient: vi.fn() }));

const getTrial = vi.mocked(getTrialDetailsAction);
const trialId = "22222222-2222-2222-2222-222222222222";
const params = (id: string) => Promise.resolve({ id });
const ketamine = {
  id: trialId,
  title: "Ketamine for Treatment-Resistant Depression",
  description: "Evaluating the safety and efficacy of Ketamine.",
  status: "recruiting",
  phase: "phase_2",
  start_date: new Date("2025-02-01T00:00:00Z"),
  end_date: null,
  enrollment_target: 200,
  current_enrollment: 0,
  location: "Boston, New York",
  inclusion_criteria: ["Age 18 or older"],
  exclusion_criteria: [],
  condition_name: "Major Depressive Disorder",
  treatment_name: "Ketamine",
  research_partner_name: "Demo Sponsor",
  research_partner_id: "33333333-3333-3333-3333-333333333333",
  condition_id: "major-depressive-disorder",
  treatment_id: "ketamine",
  compensation: null,
  created_at: null,
  updated_at: null,
  deleted_at: null,
} satisfies TrialDetails;

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("trial details page", () => {
  it("is outside the login-only route group, so public trial lists can link to it", () => {
    const app = path.join(process.cwd(), "app");
    expect(existsSync(path.join(app, "(public)/patient/trial-details/[id]/page.tsx"))).toBe(true);
    expect(existsSync(path.join(app, "(protected)/patient/trial-details"))).toBe(false);
  });

  it("shows a visitor only the values in the trial record", async () => {
    getTrial.mockResolvedValue(ketamine);
    vi.mocked(getServerUser).mockResolvedValue(null);

    render(await TrialDetailsPage({ params: params(trialId) }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ketamine.title);
    expect(screen.getByText("Recruiting")).toBeInTheDocument();
    expect(screen.getAllByText("Phase 2")).toHaveLength(2);
    expect(screen.getByText("Sponsored by Demo Sponsor")).toBeInTheDocument();
    expect(screen.getByText("Major Depressive Disorder")).toBeInTheDocument();
    expect(screen.getByText("Feb 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("0 of 200 participants")).toBeInTheDocument();
    expect(screen.getByText("Age 18 or older")).toBeInTheDocument();
    // The end date and exclusion criteria are missing, not replaced with defaults.
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByText("Not provided by the sponsor.")).toBeInTheDocument();
    for (const invented of [/\$50/, /\$200/, /12 weeks/, /Main Research Hospital/, /Compensation/]) {
      expect(screen.queryByText(invented)).not.toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Log In to Enroll" })).toBeInTheDocument();
    expect(getTrialEnrollmentStatusAction).not.toHaveBeenCalled();
  });

  it("returns not found when there is no readable trial with the id", async () => {
    getTrial.mockResolvedValue(null);

    await expect(TrialDetailsPage({ params: params("not-a-trial") })).rejects.toThrow("NOT_FOUND");
  });
});

describe("getTrialDetailsAction", () => {
  const actual = () => vi.importActual<typeof import("@/lib/actions/trials")>("@/lib/actions/trials");

  it("returns null for an id that is not a UUID without querying the database", async () => {
    const { getTrialDetailsAction: query } = await actual();

    await expect(query("not-a-trial")).resolves.toBeNull();
    expect(getUserDb).not.toHaveBeenCalled();
  });

  it("flattens the condition, treatment and sponsor names", async () => {
    const row = {
      id: trialId,
      title: "Ketamine",
      compensation: null,
      global_conditions: { global_variables: { name: "Major Depressive Disorder" } },
      global_treatments: { global_variables: { name: "Ketamine" } },
      profiles: { first_name: "Demo", last_name: null },
    };
    const findUnique = vi.fn().mockResolvedValue(row);
    vi.mocked(getUserDb).mockResolvedValue({ trials: { findUnique } } as unknown as Awaited<ReturnType<typeof getUserDb>>);
    const { getTrialDetailsAction: getDetails } = await actual();

    await expect(getDetails(trialId)).resolves.toEqual({
      id: trialId,
      title: "Ketamine",
      compensation: null,
      condition_name: "Major Depressive Disorder",
      treatment_name: "Ketamine",
      research_partner_name: "Demo",
    });
  });
});
