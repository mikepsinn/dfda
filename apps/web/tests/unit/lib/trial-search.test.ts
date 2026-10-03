import { describe, expect, it } from "vitest";
import {
  MAX_SEARCH_TEXT_LENGTH,
  defaultTrialSearchForm,
  describeTrialSearch,
  parseNear,
  parseTrialSearch,
  trialSearchQuery,
} from "@/lib/trials/trial-search";

describe("parseTrialSearch", () => {
  it("shows the default form and searches nothing without a condition, treatment or location", () => {
    expect(parseTrialSearch({})).toEqual({ form: defaultTrialSearchForm, search: null, error: null });
    expect(parseTrialSearch({ status: "completed", sex: "female" }).search).toBeNull();
  });

  it("turns the form's parameters into a registry search", () => {
    const { form, search } = parseTrialSearch({
      condition: " Asthma ",
      location: "Boston, Massachusetts",
      status: "not-yet-recruiting",
      type: "int",
      sex: "female",
      age: ["older_adult", "child"],
    });
    expect(form.ages).toEqual(["child", "older_adult"]);
    expect(search).toEqual({
      condition: "Asthma",
      treatment: undefined,
      location: "Boston, Massachusetts",
      near: undefined,
      status: "not yet recruiting",
      studyType: "int",
      sex: "female",
      ageGroups: ["child", "older_adult"],
    });
    expect(parseTrialSearch({ treatment: "Metformin", status: "all" }).search?.status).toBeUndefined();
  });

  it("ignores invalid values and uses the first of repeated text parameters", () => {
    const { form, search } = parseTrialSearch({ condition: ["Asthma", "Migraine"], status: "RECRUITING", type: "pat", sex: "x", age: "teen" });
    expect(form).toEqual({ ...defaultTrialSearchForm, condition: "Asthma" });
    expect(search).toMatchObject({ condition: "Asthma", status: "recruiting", studyType: undefined, sex: undefined, ageGroups: undefined });
  });

  it("refuses a text that is too long to search", () => {
    const result = parseTrialSearch({ condition: "Asthma", treatment: "x".repeat(MAX_SEARCH_TEXT_LENGTH + 1) });
    expect(result.search).toBeNull();
    expect(result.error).toMatch(/treatment is too long/);
  });
});

describe("trialSearchQuery", () => {
  it("leaves defaults out and keeps every other value, so a link repeats the search", () => {
    expect(trialSearchQuery(defaultTrialSearchForm).toString()).toBe("");
    const { form } = parseTrialSearch({ condition: "Asthma", status: "all", sex: "male", age: ["child", "adult"] });
    const query = trialSearchQuery(form);
    expect(query.toString()).toBe("condition=Asthma&status=all&sex=male&age=child&age=adult");
    expect(parseTrialSearch(Object.fromEntries([...new Set(query.keys())].map(key => [key, query.getAll(key)]))).form).toEqual(form);
  });
});

describe("searching near the browser's location", () => {
  it("rounds the point to about 1 km and rejects anything that is not a point on Earth", () => {
    expect(parseNear("42.36012,-71.05891")).toEqual({ lat: 42.36, lng: -71.06 });
    expect(parseNear(" 42.36, -71.06 ")).toEqual({ lat: 42.36, lng: -71.06 });
    for (const value of ["", "42.36", "91,0", "0,181", "a,b", "42.36,-71.06,5"]) expect(parseNear(value)).toBeNull();
  });

  it("searches near the point instead of the typed place, and keeps the point and distance in links", () => {
    const { form, search } = parseTrialSearch({ near: "42.3601,-71.0589", distance: "25", location: "Paris" });
    expect(form).toMatchObject({ near: "42.36,-71.06", distance: "25", location: "" });
    expect(search).toMatchObject({ near: { lat: 42.36, lng: -71.06, miles: 25 }, location: undefined });
    expect(trialSearchQuery(form).toString()).toBe("near=42.36%2C-71.06&distance=25");
    expect(parseTrialSearch({ near: "42.36,-71.06", distance: "7" }).form.distance).toBe("50");
    expect(trialSearchQuery(parseTrialSearch({ near: "42.36,-71.06" }).form).toString()).toBe("near=42.36%2C-71.06");
  });
});

describe("describeTrialSearch", () => {
  it("names each part of the search in a short phrase", () => {
    expect(describeTrialSearch(parseTrialSearch({ condition: "Asthma", location: "Boston" }).form)).toEqual([
      "Condition: Asthma", "Location: Boston", "Recruiting",
    ]);
    const { form } = parseTrialSearch({
      treatment: "Metformin", near: "42.36,-71.06", distance: "100", status: "all", type: "int", sex: "female", age: ["child", "older_adult"],
    });
    expect(describeTrialSearch(form)).toEqual([
      "Treatment: Metformin", "Within 100 miles of your location", "Any status", "Interventional studies",
      "Open to women", "Open to ages: child, older adult",
    ]);
  });
});
