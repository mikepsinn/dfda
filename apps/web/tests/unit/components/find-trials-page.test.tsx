import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FindTrialsPage from "@/app/(public)/find-trials/page";
import { RegistrySuggestInput } from "@/components/trials/registry-suggest-input";
import { searchRegistryTrials, type RegistryTrial } from "@/lib/trials/registry-trials";

vi.mock("@/lib/trials/registry-trials", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/trials/registry-trials")>()),
  searchRegistryTrials: vi.fn(),
}));

const search = vi.mocked(searchRegistryTrials);
const trial: RegistryTrial = {
  nctId: "NCT05000001",
  title: "Montelukast for Childhood Asthma",
  summary: "A study of montelukast in children.",
  status: "RECRUITING",
  startDate: "2025-03",
  studyType: "INTERVENTIONAL",
  phases: ["PHASE3"],
  sponsor: "Example University",
  interventions: ["Montelukast"],
  locations: ["Boston, United States"],
  url: "https://clinicaltrials.gov/study/NCT05000001",
};
const renderPage = async (query: Record<string, string | string[]> = {}) =>
  render(await FindTrialsPage({ searchParams: Promise.resolve(query) }));

beforeEach(() => {
  vi.clearAllMocks();
  search.mockResolvedValue({
    ok: true, total: 25, trials: [trial], searchUrl: "https://clinicaltrials.gov/search?cond=Asthma",
    nextPageToken: "Next2", paginationReset: false,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("find trials page", () => {
  it("shows the search form and examples, and searches nothing, until there is a search term", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Find Clinical Trials" })).toBeInTheDocument();
    const form = screen.getByRole("search", { name: "Search clinical trials" });
    expect(form).toHaveAttribute("action", "/find-trials");
    expect(form).toHaveAttribute("method", "get");
    expect(within(form).getByLabelText("Study status")).toHaveValue("recruiting");
    expect(screen.getByText(/Enter a condition, a treatment or a location/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Metformin" })).toHaveAttribute("href", "/find-trials?treatment=Metformin");
    expect(search).not.toHaveBeenCalled();
  });

  it("searches the registry with the form's values and keeps them in the page links", async () => {
    await renderPage({ condition: "Asthma", location: "Boston", sex: "female", age: "child" });

    expect(search).toHaveBeenCalledWith(
      { condition: "Asthma", treatment: undefined, location: "Boston", status: "recruiting", studyType: undefined, sex: "female", ageGroups: ["child"] },
      { pageToken: undefined },
    );
    expect(screen.getByLabelText("Condition")).toHaveValue("Asthma");
    expect(screen.getByLabelText("Participant's sex")).toHaveValue("female");
    expect(screen.getByRole("checkbox", { name: "Child (0–17)" })).toBeChecked();
    expect(screen.getByRole("heading", { level: 2, name: "Results from ClinicalTrials.gov" })).toBeInTheDocument();
    expect(screen.getByText(/of 25 matching studies/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href", "/find-trials?condition=Asthma&location=Boston&sex=female&age=child&page=2&pageToken=Next2&total=25",
    );
    expect(screen.getByRole("link", { name: /Clear search/ })).toHaveAttribute("href", "/find-trials");
  });

  it("shows a later page with the carried number and count", async () => {
    search.mockResolvedValue({ ok: true, total: null, trials: [trial], searchUrl: "", nextPageToken: null, paginationReset: false });
    await renderPage({ treatment: "Montelukast", page: "2", pageToken: "Next2", total: "25" });

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ treatment: "Montelukast" }), { pageToken: "Next2" });
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /First page/ })).toHaveAttribute("href", "/find-trials?treatment=Montelukast");
  });

  it("offers no next page when this page holds the last match, even with a registry cursor", async () => {
    search.mockResolvedValue({ ok: true, total: 10, trials: [trial], searchUrl: "", nextPageToken: "Next2", paginationReset: false });
    await renderPage({ condition: "Asthma" });
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("explains an empty result and a text that is too long", async () => {
    search.mockResolvedValue({ ok: true, total: 0, trials: [], searchUrl: "", nextPageToken: null, paginationReset: false });
    await renderPage({ condition: "Asthma", location: "Antarctica" });
    expect(screen.getByText(/lists no studies that match this search/)).toBeInTheDocument();

    cleanup();
    search.mockClear();
    await renderPage({ condition: "x".repeat(201) });
    expect(screen.getByRole("alert")).toHaveTextContent("The condition is too long to search");
    expect(search).not.toHaveBeenCalled();
  });
});

describe("RegistrySuggestInput", () => {
  it("asks ClinicalTrials.gov for names only after typing, and lists them for the browser", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(["Asthma", "Asthma \\(Diagnosis\\)", "Asthma", 7])));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <RegistrySuggestInput dictionary="Condition" id="c" name="condition" defaultValue="Ast" placeholder="" maxLength={200} />,
    );

    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByRole("combobox"), "h");
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.toString()).toBe("https://clinicaltrials.gov/api/int/suggest?input=Asth&dictionary=Condition");
    const options = [...container.querySelectorAll("datalist option")].map(option => option.getAttribute("value"));
    expect(options).toEqual(["Asthma", "Asthma (Diagnosis)"]);
  });
});
