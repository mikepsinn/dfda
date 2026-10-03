import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatRegistryCode,
  formatRegistryDate,
  formatRegistryPhases,
  getRecruitingRegistryTrials,
  isRegistryPageToken,
  quoteLocationText,
  quoteSearchText,
  registryApiUrl,
  registryPagePosition,
  registrySearchPageUrl,
  registrySearchUrl,
  searchRegistryTrials,
  toRegistryTrial,
} from "@/lib/trials/registry-trials";

// The fields the page reads, in the shape of a ClinicalTrials.gov API v2 study.
const study = {
  protocolSection: {
    identificationModule: {
      nctId: "NCT06392867",
      briefTitle: "Intermittent Theta-burst Stimulation for Major Depression",
      officialTitle: "Intermittent Theta-burst Stimulation for Major Depression: an Intensity-response Study",
    },
    statusModule: { overallStatus: "RECRUITING", startDateStruct: { date: "2024-01-08", type: "ACTUAL" } },
    descriptionModule: { briefSummary: "  Daily iTBS for four weeks.  " },
    designModule: { studyType: "INTERVENTIONAL", phases: ["NA"] },
    sponsorCollaboratorsModule: { leadSponsor: { name: "The Hong Kong Polytechnic University" } },
    armsInterventionsModule: { interventions: [{ name: "iTBS" }, { name: "Sham iTBS" }, { name: "iTBS" }] },
    contactsLocationsModule: {
      locations: [
        { city: "Hong Kong", country: "Hong Kong" },
        { city: "Hong Kong", country: "Hong Kong" },
        { country: "China" },
      ],
    },
  },
};

const respond = (body: unknown, status = 200) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe("toRegistryTrial", () => {
  it("keeps the fields a trial card shows and drops repeated sites and interventions", () => {
    expect(toRegistryTrial(study)).toEqual({
      nctId: "NCT06392867",
      title: "Intermittent Theta-burst Stimulation for Major Depression",
      summary: "Daily iTBS for four weeks.",
      status: "RECRUITING",
      startDate: "2024-01-08",
      studyType: "INTERVENTIONAL",
      phases: ["NA"],
      sponsor: "The Hong Kong Polytechnic University",
      interventions: ["iTBS", "Sham iTBS"],
      locations: ["Hong Kong, Hong Kong", "China"],
      url: "https://clinicaltrials.gov/study/NCT06392867",
    });
  });

  it("rejects a study without a valid NCT ID or a title", () => {
    const withId = (nctId: unknown, briefTitle: unknown = "A study") => ({
      protocolSection: { identificationModule: { nctId, briefTitle } },
    });
    expect(toRegistryTrial(withId("NCT0639"))).toBeNull();
    expect(toRegistryTrial(withId("javascript:alert(1)"))).toBeNull();
    expect(toRegistryTrial(withId("NCT06392867", " "))).toBeNull();
    expect(toRegistryTrial(null)).toBeNull();
  });

  it("leaves missing optional fields empty", () => {
    expect(toRegistryTrial({ protocolSection: { identificationModule: { nctId: "NCT00000001", briefTitle: "A" } } }))
      .toMatchObject({ summary: null, status: null, startDate: null, studyType: null, phases: [], sponsor: null, interventions: [], locations: [] });
  });
});

describe("getRecruitingRegistryTrials", () => {
  it("requests one cached page of recruiting studies for the quoted condition name", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ totalCount: 409, nextPageToken: "ZVNj7o2Elu8", studies: [study, { protocolSection: {} }] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getRecruitingRegistryTrials("Major Depressive Disorder");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { next?: { revalidate: number } }];
    expect(url.searchParams.get("query.cond")).toBe('"Major Depressive Disorder"');
    expect(url.searchParams.get("filter.overallStatus")).toBe("RECRUITING");
    expect(url.searchParams.get("pageSize")).toBe("10");
    expect(url.searchParams.get("fields")).toContain("protocolSection.descriptionModule.briefSummary");
    expect(url.searchParams.has("pageToken")).toBe(false);
    expect(init.next).toEqual({ revalidate: 3600 });
    expect(result).toEqual({
      ok: true,
      total: 409,
      trials: [toRegistryTrial(study)],
      searchUrl: registrySearchUrl("Major Depressive Disorder"),
      nextPageToken: "ZVNj7o2Elu8",
      paginationReset: false,
    });
  });

  it("requests a later page by its cursor without the cache, and reports its total as unknown", async () => {
    // The registry counts matches only on the first page.
    const fetchMock = vi.fn().mockResolvedValue(respond({ studies: [study] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getRecruitingRegistryTrials("Asthma", { pageToken: "ZVNj7o2Elu8" });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.get("pageToken")).toBe("ZVNj7o2Elu8");
    expect(init.cache).toBe("no-store");
    expect(result).toMatchObject({ ok: true, total: null, nextPageToken: null, paginationReset: false });
  });

  it("shows the first page again, without the cache, when the cursor has expired", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond("Incorrect pageToken format", 400))
      .mockResolvedValueOnce(respond({ totalCount: 409, nextPageToken: "fresh", studies: [study] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getRecruitingRegistryTrials("Asthma", { pageToken: "expired" });

    const [retryUrl, retryInit] = fetchMock.mock.calls[1] as [URL, RequestInit];
    expect(retryUrl.searchParams.has("pageToken")).toBe(false);
    expect(retryInit.cache).toBe("no-store");
    expect(result).toMatchObject({ ok: true, nextPageToken: "fresh", paginationReset: true });
  });

  it("ignores a cursor that is not a registry token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ totalCount: 0, studies: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await getRecruitingRegistryTrials("Asthma", { pageToken: "a&filter.geo=x" });

    expect((fetchMock.mock.calls[0][0] as URL).searchParams.has("pageToken")).toBe(false);
  });

  it("returns a registry search link instead of throwing when the request fails", async () => {
    const searchUrl = registrySearchUrl("Asthma");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond("Forbidden", 403)));
    await expect(getRecruitingRegistryTrials("Asthma")).resolves.toEqual({ ok: false, searchUrl });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(getRecruitingRegistryTrials("Asthma")).resolves.toEqual({ ok: false, searchUrl });
  });
});

describe("registry search text", () => {
  it("quotes a condition name so the registry does not read it as query syntax", () => {
    expect(quoteSearchText(" Anxiety (Generalized) ")).toBe('"Anxiety (Generalized)"');
    expect(quoteSearchText('a "b" \\ c')).toBe('"a \\"b\\" \\\\ c"');
  });

  it("accepts only token-shaped page cursors", () => {
    expect(isRegistryPageToken("ZVNj7o2Elu8o3lpwTNixparumpOQJJxobfCh2Pg")).toBe(true);
    for (const value of ["", "a b", "a&b=c", ["ZVNj"], undefined, "x".repeat(201)]) {
      expect(isRegistryPageToken(value)).toBe(false);
    }
  });

  it("links to the recruiting-studies search for the condition", () => {
    const url = new URL(registrySearchUrl("Major Depressive Disorder"));
    expect(url.origin + url.pathname).toBe("https://clinicaltrials.gov/search");
    expect(url.searchParams.get("cond")).toBe("Major Depressive Disorder");
    expect(url.searchParams.get("aggFilters")).toBe("status:rec");
  });
});

describe("registry display text", () => {
  it("formats phases, codes and dates", () => {
    expect(formatRegistryPhases(["PHASE2", "PHASE3"])).toBe("Phase 2, Phase 3");
    expect(formatRegistryPhases(["EARLY_PHASE1"])).toBe("Early phase 1");
    expect(formatRegistryPhases(["NA"])).toBeNull();
    expect(formatRegistryCode("EXPANDED_ACCESS")).toBe("Expanded access");
    expect(formatRegistryCode("NOT_YET_RECRUITING")).toBe("Not yet recruiting");
    expect(formatRegistryDate("2024-01-08")).toBe("Jan 8, 2024");
    expect(formatRegistryDate("2024-01")).toBe("Jan 2024");
    expect(formatRegistryDate("soon")).toBe("soon");
  });
});

describe("searchRegistryTrials", () => {
  it("sends names as quoted phrases and each comma-separated place as its own phrase", () => {
    const url = registryApiUrl({ condition: "Asthma", treatment: "Montelukast", location: " Boston,  Massachusetts ,", status: "completed" });
    expect(url.searchParams.get("query.cond")).toBe('"Asthma"');
    expect(url.searchParams.get("query.intr")).toBe('"Montelukast"');
    expect(url.searchParams.get("query.locn")).toBe('"Boston" AND "Massachusetts"');
    expect(url.searchParams.get("filter.overallStatus")).toBe("COMPLETED");
    expect(url.searchParams.has("filter.advanced")).toBe(false);
    expect(quoteLocationText(" , ")).toBe("");
  });

  it("searches within a distance of a point instead of the place names", () => {
    const url = registryApiUrl({ condition: "Asthma", location: "Paris", near: { lat: 42.36, lng: -71.06, miles: 25 } });
    expect(url.searchParams.get("filter.geo")).toBe("distance(42.36,-71.06,25mi)");
    expect(url.searchParams.has("query.locn")).toBe(false);
  });

  it("keeps studies open to the participant's sex, including studies open to all sexes", () => {
    // AREA[Sex]FEMALE would keep only the studies limited to women.
    expect(registryApiUrl({ condition: "Asthma", sex: "female" }).searchParams.get("filter.advanced")).toBe("NOT AREA[Sex]MALE");
    const url = registryApiUrl({ condition: "Asthma", sex: "male", studyType: "int", ageGroups: ["child", "older_adult"] });
    expect(url.searchParams.get("filter.advanced")).toBe(
      "AREA[StudyType]INTERVENTIONAL AND AREA[StdAge](CHILD OR OLDER_ADULT) AND NOT AREA[Sex]FEMALE",
    );
  });

  it("searches any status when none is given, and links to the registry search with the terms it supports", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ totalCount: 3, studies: [study] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchRegistryTrials({ treatment: "Metformin", location: "Germany" });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.has("filter.overallStatus")).toBe(false);
    expect(url.searchParams.has("query.cond")).toBe(false);
    expect(result).toMatchObject({ ok: true, total: 3, searchUrl: registrySearchPageUrl({ treatment: "Metformin" }) });
    const link = new URL(registrySearchPageUrl({ condition: "Asthma", treatment: "Metformin", status: "completed" }));
    expect([...link.searchParams]).toEqual([["cond", "Asthma"], ["intr", "Metformin"]]);
  });
});

describe("registryPagePosition", () => {
  const page = (overrides = {}) => ({
    ok: true as const, total: null, trials: [], searchUrl: "", nextPageToken: null, paginationReset: false, ...overrides,
  });

  it("uses the first page's count, and the number and count carried to a later page", () => {
    expect(registryPagePosition(page({ total: 458 }), {})).toEqual({ page: 1, total: 458 });
    expect(registryPagePosition(page(), { pageToken: "Next2", page: "3", total: "458" })).toEqual({ page: 3, total: 458 });
  });

  it("restarts at page 1 after an expired cursor, and ignores carried values that are not counts", () => {
    expect(registryPagePosition(page({ total: 458, paginationReset: true }), { pageToken: "Old", page: "3" })).toEqual({ page: 1, total: 458 });
    expect(registryPagePosition(page(), { pageToken: "Next2", page: "2.5", total: "-1" })).toEqual({ page: 1, total: null });
    expect(registryPagePosition(page(), { page: "4", total: "458" })).toEqual({ page: 1, total: null });
    expect(registryPagePosition({ ok: false, searchUrl: "" }, { pageToken: "Next2", page: "2", total: "9" })).toEqual({ page: 1, total: null });
  });
});
