import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FindTrialsPage from "@/app/(public)/find-trials/page";
import { LocationField } from "@/components/trials/location-field";
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
    expect(form).toHaveAttribute("action", "/find-trials#results");
    expect(form).toHaveAttribute("method", "get");
    expect(within(form).getByLabelText("Study status")).toHaveValue("recruiting");
    expect(screen.getByText(/Enter a condition, a treatment or a location/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Metformin" })).toHaveAttribute("href", "/find-trials?treatment=Metformin#results");
    expect(search).not.toHaveBeenCalled();
  });

  it("searches the registry with the form's values and keeps them in the page links", async () => {
    await renderPage({ condition: "Asthma", location: "Boston", sex: "female", age: "child" });

    expect(search).toHaveBeenCalledWith(
      {
        condition: "Asthma", treatment: undefined, location: "Boston", near: undefined, status: "recruiting",
        studyType: undefined, sex: "female", ageGroups: ["child"],
      },
      { pageToken: undefined },
    );
    expect(within(screen.getByRole("list", { name: "Search criteria" })).getAllByRole("listitem").map(item => item.textContent))
      .toEqual(["Condition: Asthma", "Location: Boston", "Recruiting", "Open to women", "Open to ages: child"]);
    expect(screen.getByRole("link", { name: "Change search" })).toHaveAttribute("href", "#trial-search");
    expect(screen.getByLabelText("Condition")).toHaveValue("Asthma");
    expect(screen.getByLabelText("Participant's sex")).toHaveValue("female");
    expect(screen.getByRole("checkbox", { name: "Child (0–17)" })).toBeChecked();
    expect(screen.getByRole("region", { name: "Trials" })).toHaveAttribute("id", "registry-trials");
    expect(screen.getByText(/of 25 matching studies on ClinicalTrials.gov/)).toBeInTheDocument();
    expect(screen.queryByText(/have not reviewed|National Library of Medicine/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href", "/find-trials?condition=Asthma&location=Boston&sex=female&age=child&page=2&pageToken=Next2&total=25#registry-trials",
    );
    expect(screen.getByRole("link", { name: /Clear search/ })).toHaveAttribute("href", "/find-trials");
  });

  it("shows a later page with the carried number and count", async () => {
    search.mockResolvedValue({ ok: true, total: null, trials: [trial], searchUrl: "", nextPageToken: null, paginationReset: false });
    await renderPage({ treatment: "Montelukast", page: "2", pageToken: "Next2", total: "25" });

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ treatment: "Montelukast" }), { pageToken: "Next2" });
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /First page/ })).toHaveAttribute("href", "/find-trials?treatment=Montelukast#registry-trials");
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

describe("LocationField", () => {
  const renderField = (defaultNear = "") =>
    render(
      <form aria-label="search">
        <LocationField defaultLocation="" defaultNear={defaultNear} defaultDistance="50" maxLength={200} />
      </form>,
    );
  const stubLocation = (getCurrentPosition: (ok: PositionCallback, fail: PositionErrorCallback) => void) =>
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });

  it("replaces the place field with the rounded browser location and a distance", async () => {
    stubLocation(ok => ok({ coords: { latitude: 42.360123, longitude: -71.058912 } } as GeolocationPosition));
    const user = userEvent.setup();
    renderField();

    await user.click(await screen.findByRole("button", { name: "Use my location" }));

    const form = screen.getByRole("form", { name: "search" }) as HTMLFormElement;
    expect(Object.fromEntries(new FormData(form))).toEqual({ near: "42.36,-71.06", distance: "50" });
    expect(screen.getByLabelText("Distance from your location")).toHaveValue("50");

    await user.click(screen.getByRole("button", { name: "Remove your location" }));
    expect(Object.fromEntries(new FormData(form))).toEqual({ location: "" });
  });

  it("asks for a typed place when location access is blocked", async () => {
    stubLocation((_ok, fail) => fail({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError));
    const user = userEvent.setup();
    renderField();

    await user.click(await screen.findByRole("button", { name: "Use my location" }));

    expect(screen.getByRole("status")).toHaveTextContent("Location access is blocked. Type a city");
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
  });

  it("offers no location button when the browser has no location service", () => {
    vi.stubGlobal("navigator", { userAgent: "test" });
    renderField();
    expect(screen.queryByRole("button", { name: "Use my location" })).not.toBeInTheDocument();
  });
});
