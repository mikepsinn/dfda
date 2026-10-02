import { describe, expect, it } from "vitest";
import { MAX_SEARCH_TEXT_LENGTH, defaultTrialSearchForm, parseTrialSearch, trialSearchQuery } from "@/lib/trials/trial-search";

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
