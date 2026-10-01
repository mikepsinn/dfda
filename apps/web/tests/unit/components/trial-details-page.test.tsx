import { existsSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrialDetailsPage from "@/app/(public)/patient/trial-details/[id]/page";
import { getTrialDetailsAction, type TrialDetails } from "@/lib/actions/trials";
import { getTrialEnrollmentStatusAction } from "@/lib/actions/trial-enrollments";
import { getServerUser } from "@/lib/server-auth";
import { createClient } from "@/utils/supabase/server";

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
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));
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
  start_date: "2025-02-01",
  end_date: null,
  enrollment_target: 200,
  current_enrollment: 0,
  location: "Boston, New York",
  inclusion_criteria: ["Age 18 or older"],
  exclusion_criteria: null,
  condition_name: "Major Depressive Disorder",
  treatment_name: "Ketamine",
  research_partner_name: "Demo Sponsor",
} as TrialDetails;

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
    expect(createClient).not.toHaveBeenCalled();
  });

  it("flattens the condition, treatment and sponsor names", async () => {
    const row = {
      id: trialId,
      title: "Ketamine",
      condition: { global_variables: { name: "Major Depressive Disorder" } },
      treatment: { global_variables: { name: "Ketamine" } },
      research_partner: { first_name: "Demo", last_name: null },
    };
    const query = { select: () => query, eq: () => query, maybeSingle: () => Promise.resolve({ data: row, error: null }) };
    vi.mocked(createClient).mockResolvedValue({ from: () => query } as unknown as Awaited<ReturnType<typeof createClient>>);
    const { getTrialDetailsAction: getDetails } = await actual();

    await expect(getDetails(trialId)).resolves.toEqual({
      id: trialId,
      title: "Ketamine",
      condition_name: "Major Depressive Disorder",
      treatment_name: "Ketamine",
      research_partner_name: "Demo",
    });
  });
});
