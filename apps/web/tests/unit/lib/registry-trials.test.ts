import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatRegistryPhases,
  formatRegistryStudyType,
  getRecruitingRegistryTrials,
  registrySearchUrl,
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

afterEach(() => vi.unstubAllGlobals());

describe("toRegistryTrial", () => {
  it("keeps the fields a trial list shows and drops repeated sites and interventions", () => {
    expect(toRegistryTrial(study)).toEqual({
      nctId: "NCT06392867",
      title: "Intermittent Theta-burst Stimulation for Major Depression",
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
      .toMatchObject({ studyType: null, phases: [], sponsor: null, interventions: [], locations: [] });
  });
});

describe("getRecruitingRegistryTrials", () => {
  it("asks the registry for recruiting studies of the condition", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ totalCount: 458, studies: [study, { protocolSection: {} }] })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getRecruitingRegistryTrials("Major Depressive Disorder", 20);

    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get("query.cond")).toBe("Major Depressive Disorder");
    expect(url.searchParams.get("filter.overallStatus")).toBe("RECRUITING");
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(result).toEqual({
      ok: true,
      total: 458,
      trials: [toRegistryTrial(study)],
      searchUrl: registrySearchUrl("Major Depressive Disorder"),
    });
  });

  it("returns a registry search link instead of throwing when the request fails", async () => {
    const searchUrl = registrySearchUrl("Asthma");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Forbidden", { status: 403 })));
    await expect(getRecruitingRegistryTrials("Asthma")).resolves.toEqual({ ok: false, searchUrl });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(getRecruitingRegistryTrials("Asthma")).resolves.toEqual({ ok: false, searchUrl });
  });
});

describe("registry display text", () => {
  it("links to the recruiting-studies search for the condition", () => {
    const url = new URL(registrySearchUrl("Major Depressive Disorder"));
    expect(url.origin + url.pathname).toBe("https://clinicaltrials.gov/search");
    expect(url.searchParams.get("cond")).toBe("Major Depressive Disorder");
    expect(url.searchParams.get("aggFilters")).toBe("status:rec");
  });

  it("formats phases and study types", () => {
    expect(formatRegistryPhases(["PHASE2", "PHASE3"])).toBe("Phase 2, Phase 3");
    expect(formatRegistryPhases(["EARLY_PHASE1"])).toBe("Early phase 1");
    expect(formatRegistryPhases(["NA"])).toBeNull();
    expect(formatRegistryStudyType("EXPANDED_ACCESS")).toBe("Expanded access");
  });
});
