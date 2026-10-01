import { describe, expect, it } from "vitest";

import {
  buildClinicalTrialsSearchUrl,
  toClinicalTrialsOffsetPage,
} from "@/lib/trials/clinical-trials-gov";

describe("buildClinicalTrialsSearchUrl", () => {
  it("searches the public v2 API", () => {
    // The site's own /api/int/studies endpoint answers 403 to every caller.
    const url = buildClinicalTrialsSearchUrl({ condition: "Asthma" });

    expect(url.origin).toBe("https://clinicaltrials.gov");
    expect(url.pathname).toBe("/api/v2/studies");
    expect(url.searchParams.get("query.cond")).toBe("Asthma");
  });

  it("drops the text location when the search carries coordinates", () => {
    // The form fills locStr with "Current Location" whenever it sends
    // coordinates, and v2 reads query.locn as a place name, so sending both
    // matched no studies at all.
    const url = buildClinicalTrialsSearchUrl({
      condition: "Asthma",
      lat: 40.7,
      lng: -74,
      distance: 25,
      locStr: "Current Location",
    });

    expect(url.searchParams.get("filter.geo")).toBe("distance(40.7,-74,25mi)");
    expect(url.searchParams.has("query.locn")).toBe(false);
  });

  it("falls back to a 50 mile radius when the search sends no distance", () => {
    const url = buildClinicalTrialsSearchUrl({ condition: "Asthma", lat: 40.7, lng: -74 });

    expect(url.searchParams.get("filter.geo")).toBe("distance(40.7,-74,50mi)");
  });

  it("ignores unusable coordinates and falls back to the place name", () => {
    // The page parses lat/lng with parseFloat, so a hand-edited link can carry
    // NaN or an out-of-range value; both used to reach the API as filter.geo.
    const nan = buildClinicalTrialsSearchUrl({ condition: "x", lat: Number.NaN, lng: -74, locStr: "Boston" });
    expect(nan.searchParams.get("filter.geo")).toBeNull();
    expect(nan.searchParams.get("query.locn")).toBe("Boston");

    const outOfRange = buildClinicalTrialsSearchUrl({ condition: "x", lat: 91, lng: -74, locStr: "Boston" });
    expect(outOfRange.searchParams.get("filter.geo")).toBeNull();

    const badRadius = buildClinicalTrialsSearchUrl({ condition: "x", lat: 42.4, lng: -71.1, distance: Number.NaN });
    expect(badRadius.searchParams.get("filter.geo")).toBe("distance(42.4,-71.1,50mi)");
  });

  it("keeps a typed place name when there are no coordinates", () => {
    const url = buildClinicalTrialsSearchUrl({
      condition: "Asthma",
      locStr: "New York",
    });

    expect(url.searchParams.get("query.locn")).toBe("New York");
    expect(url.searchParams.has("filter.geo")).toBe(false);
  });

  it("drops filter values that are not in the API's enums", () => {
    // These arrive from the query string, and v2 rejects the whole request
    // for one bad filter value.
    const url = buildClinicalTrialsSearchUrl({
      condition: "Asthma",
      studyStatus: "bogus" as never,
      studyType: "bogus" as never,
      sex: "bogus" as never,
      ageGroups: ["bogus" as never, "child"],
    });

    expect(url.searchParams.has("filter.overallStatus")).toBe(false);
    expect(url.searchParams.get("filter.advanced")).toBe("AREA[StdAge](CHILD)");
  });

  it("leaves the 'all' selections unfiltered", () => {
    const url = buildClinicalTrialsSearchUrl({
      condition: "Asthma",
      studyType: "all",
      sex: "all",
    });

    expect(url.searchParams.has("filter.advanced")).toBe(false);
  });

  // `from` is parseInt'd straight off the query string, so ?from=abc arrives
  // as NaN and the API rejects "pageSize=NaN" outright.
  it("ignores offsets that are not usable numbers", () => {
    for (const from of [Number.NaN, -5, undefined]) {
      const pageSize = buildClinicalTrialsSearchUrl({
        condition: "Asthma",
        from: from as number,
        limit: 10,
      }).searchParams.get("pageSize");
      expect(pageSize).toBe("10");
    }
  });

  it("reads enough studies to reach the requested offset, up to the API cap", () => {
    expect(
      buildClinicalTrialsSearchUrl({ from: 40, limit: 10 }).searchParams.get("pageSize"),
    ).toBe("50");
    expect(
      buildClinicalTrialsSearchUrl({ from: 5000, limit: 10 }).searchParams.get("pageSize"),
    ).toBe("1000");
  });
});

describe("toClinicalTrialsOffsetPage", () => {
  const payload = {
    totalCount: 42,
    studies: [
      { protocolSection: { identificationModule: { nctId: "NCT00000001" } } },
      { protocolSection: { identificationModule: { nctId: "NCT00000002" } } },
      { protocolSection: { identificationModule: { nctId: "NCT00000003" } } },
    ],
  };

  it("returns the window that starts at the offset", () => {
    const page = toClinicalTrialsOffsetPage(payload, { from: 1, limit: 2 });

    expect(page.total).toBe(42);
    expect(page.hits.map((hit) => hit.id)).toEqual(["NCT00000002", "NCT00000003"]);
  });

  // A negative offset would otherwise slice from the end and return nothing.
  it("reads from the start when the offset is not a usable number", () => {
    for (const from of [Number.NaN, -5]) {
      const page = toClinicalTrialsOffsetPage(payload, { from, limit: 2 });
      expect(page.from).toBe(0);
      expect(page.hits.map((hit) => hit.id)).toEqual(["NCT00000001", "NCT00000002"]);
    }
  });

  it("returns no hits past the end of the results", () => {
    expect(toClinicalTrialsOffsetPage(payload, { from: 10, limit: 10 }).hits).toEqual([]);
  });
});

describe("toClinicalTrialsOffsetPage with a malformed payload", () => {
  it("returns an empty page instead of throwing", () => {
    // A null studies field would otherwise crash the page that renders it.
    const page = toClinicalTrialsOffsetPage({ studies: null, totalCount: 0 }, { from: 0, limit: 10 });

    expect(page.hits).toEqual([]);
    expect(page.total).toBe(0);
  });
});
