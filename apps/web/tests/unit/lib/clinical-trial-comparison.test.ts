import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import snapshot from "@/data/evidence/NCT01097616.suvorexant-sleep.v1.json";
import { extractTrialComparison, selectTrialSource, trialSnapshotSchema } from "@/lib/evidence/clinical-trial-comparison";
import { getTrialComparisons } from "@/lib/evidence/trial-comparisons";
import { getConditionEstimate, medicalSnapshot } from "@/lib/demo/treatment-estimates";

const copy = () => structuredClone(snapshot.source);

describe("bounded ClinicalTrials.gov result extraction", () => {
  it("reproduces the posted contrast, not subtraction of rounded arm means", () => {
    const result = extractTrialComparison(copy());
    expect(result.origin).toBe("trial-reported");
    expect(result.synthesis).toBe("single-study");
    expect(result.effect).toMatchObject({ value: 10.7, lower: 1.9, upper: 19.5,
      confidenceLevel: 95, direction: "treatment-minus-control" });
    expect(result.treatment).toMatchObject({ participants: 228, adjustedChange: 51.2 });
    expect(result.control).toMatchObject({ participants: 339, adjustedChange: 40.6 });
    expect(result.effect.value).not.toBeCloseTo(51.2 - 40.6, 2);
    expect(result.endpointType).toBe("SECONDARY");
    expect(result.treatment.participants + result.control.participants).not.toBe(1023);
  });

  it("joins groups by identity regardless of array order", () => {
    const source = copy();
    source.outcome.groups.reverse();
    source.outcome.denoms[0].counts.reverse();
    source.outcome.classes[0].categories[0].measurements.reverse();
    source.outcome.analyses[0].groupIds.reverse();
    expect(extractTrialComparison(source)).toEqual(extractTrialComparison(copy()));
  });

  it("retains source provenance and verifies its exact selected-object digest", () => {
    expect(trialSnapshotSchema.parse(snapshot).sourceUrl).toContain("/api/v2/studies/NCT01097616");
    expect(createHash("sha256").update(JSON.stringify(snapshot.source)).digest("hex"))
      .toBe(snapshot.sourceSha256);
  });

  it.each([
    ["missing measurement", (s: ReturnType<typeof copy>) => { s.outcome.classes[0].categories[0].measurements.pop(); }],
    ["duplicate group", (s: ReturnType<typeof copy>) => { s.outcome.groups[1].id = "OG000"; }],
    ["duplicate denominator", (s: ReturnType<typeof copy>) => { s.outcome.denoms[0].counts[1].groupId = "OG000"; }],
    ["missing count", (s: ReturnType<typeof copy>) => { s.outcome.denoms[0].counts[0].value = ""; }],
    ["zero count", (s: ReturnType<typeof copy>) => { s.outcome.denoms[0].counts[0].value = "0"; }],
    ["missing effect", (s: ReturnType<typeof copy>) => { s.outcome.analyses[0].paramValue = "NA"; }],
    ["ambiguous analysis", (s: ReturnType<typeof copy>) => { s.outcome.analyses.push(s.outcome.analyses[0]); }],
    ["missing analysis", (s: ReturnType<typeof copy>) => { s.outcome.analyses = []; }],
    ["wrong time point", (s: ReturnType<typeof copy>) => { s.outcome.timeFrame = "Month 1"; }],
    ["wrong units", (s: ReturnType<typeof copy>) => { s.outcome.unitOfMeasure = "hours"; }],
    ["reversed interval", (s: ReturnType<typeof copy>) => { s.outcome.analyses[0].ciLowerLimit = "20"; }],
    ["one-sided interval", (s: ReturnType<typeof copy>) => { s.outcome.analyses[0].ciNumSides = "ONE_SIDED"; }],
    ["wrong arm", (s: ReturnType<typeof copy>) => { s.outcome.groups[0].title = "Suvorexant HD"; }],
    ["wrong direction", (s: ReturnType<typeof copy>) => {
      Object.assign(s.outcome.analyses[0], { paramValue: "-10.7", ciLowerLimit: "-19.5", ciUpperLimit: "-1.9" });
    }],
    ["extra category", (s: ReturnType<typeof copy>) => { s.outcome.classes[0].categories.push(s.outcome.classes[0].categories[0]); }],
    ["observational design", (s: ReturnType<typeof copy>) => { s.design.studyType = "OBSERVATIONAL"; }],
  ])("rejects %s instead of guessing", (_name, mutate) => {
    const source = copy();
    mutate(source);
    expect(() => extractTrialComparison(source)).toThrow();
  });

  it("selects exactly one named endpoint from API results", () => {
    const source = copy();
    const study = {
      protocolSection: {
        identificationModule: { nctId: source.nctId, briefTitle: source.studyTitle },
        statusModule: { lastUpdatePostDateStruct: { date: source.lastUpdatePosted } },
        designModule: source.design,
      },
      resultsSection: { outcomeMeasuresModule: { outcomeMeasures: [{ title: "Another endpoint" }, source.outcome] } },
    };
    expect(selectTrialSource(study)).toEqual(source);
    study.resultsSection.outcomeMeasuresModule.outcomeMeasures.push(source.outcome);
    expect(() => selectTrialSource(study)).toThrow("expected one matching endpoint");
    study.resultsSection.outcomeMeasuresModule.outcomeMeasures = [];
    expect(() => selectTrialSource(study)).toThrow();
  });

  it("attaches only to the matching treatment without changing estimates", async () => {
    expect(getTrialComparisons("depression", "suvorexant")).toEqual([]);
    expect(getTrialComparisons("insomnia", "zolpidem")).toEqual([]);
    const [result] = getTrialComparisons("insomnia", "suvorexant");
    expect((await getConditionEstimate(result.conditionSlug))?.treatments
      .some(t => t.slug === result.treatmentSlug)).toBe(true);
    expect(medicalSnapshot.origin).toBe("model-estimate");
  });
});
