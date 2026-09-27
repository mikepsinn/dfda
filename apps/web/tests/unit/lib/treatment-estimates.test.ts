import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  conditionCatalog, conditionTreatmentsSchema, getConditionEstimate,
  medicalSnapshot, outcomeLabelHref, rankTreatments, sourceHref, treatmentSlug,
} from "@/lib/demo/treatment-estimates";

const sourceDirectory = resolve(process.cwd(), "data/optimitron/medical-data");
const readSource = (path: string) => JSON.parse(readFileSync(resolve(sourceDirectory, path), "utf8"));

describe("complete Optimitron medical snapshot", () => {
  it("retains every source file byte for byte with a complete inventory", () => {
    expect(medicalSnapshot.files).toHaveLength(221);
    for (const file of medicalSnapshot.files) {
      const bytes = readFileSync(resolve(sourceDirectory, file.path));
      expect(bytes.length, file.path).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex"), file.path).toBe(file.sha256);
    }
    expect(readdirSync(resolve(sourceDirectory, "treatments")).sort()).toEqual(
      medicalSnapshot.files.filter(f => f.path.startsWith("treatments/"))
        .map(f => f.path.slice("treatments/".length)).sort(),
    );
    expect(readSource("treatments.json")).toHaveLength(969);
    expect(readSource("references.json").references).toHaveLength(536);
  });

  it("loads all 216 conditions and 1,214 comparisons without losing any upstream field", async () => {
    expect(conditionCatalog).toHaveLength(216);
    const loaded = await Promise.all(conditionCatalog.map(c => getConditionEstimate(c.slug)));
    expect(loaded.flatMap(c => c!.treatments)).toHaveLength(1214);
    for (const condition of loaded) {
      expect(condition).not.toBeNull();
      const raw = readSource(`treatments/${condition!.slug}.json`);
      expect(condition!.treatments).toHaveLength(raw.treatments.length);
      condition!.treatments.forEach((treatment, index) => {
        expect(treatment).toMatchObject(raw.treatments[index]);
        expect(outcomeLabelHref(condition!.slug, treatment.slug)).toMatch(
          /^\/outcome-labels\/demo\/[a-z0-9-]+\/[a-z0-9-]+$/,
        );
      });
      expect(sourceHref(condition!)).toContain(`/blob/${medicalSnapshot.sourceCommit}/`);
    }
    const originals = readSource("conditions.json");
    for (const condition of conditionCatalog) {
      expect(condition).toEqual(originals.find((c: { slug: string }) => c.slug === condition.slug));
    }
    expect(medicalSnapshot.origin).toBe("model-estimate");
    expect(medicalSnapshot.reviewStatus).toBe("unverified-import");
  });

  it("keeps the existing ECT outcome and its previously omitted metadata", async () => {
    const treatment = (await getConditionEstimate("depression"))!.treatments[0];
    expect(treatment.effectiveness).toBe(90);
    expect(treatment.primaryOutcomes[0].percentageChange).toBe(-68);
    expect(treatment.primaryOutcomes[0].absoluteChange).toBe("-17 points");
    const raw = readSource("treatments/depression.json").treatments[0];
    for (const field of ["citations", "healthEconomics", "dosageRange", "timeToEffect", "treatmentDuration", "confidenceScore", "trials", "participants"]) {
      expect(treatment).toHaveProperty(field, raw[field]);
    }
  });

  it("sorts a copy by the selected metric with a deterministic tie-break", async () => {
    const original = (await getConditionEstimate("depression"))!.treatments;
    const before = original.map(t => t.slug);
    for (const sort of ["effectiveness", "safety"]) {
      const ranked = rankTreatments(original, sort);
      const key = sort === "safety" ? "safetyScore" : "effectiveness";
      expect(ranked.every((t, i) => !i || ranked[i - 1][key] >= t[key])).toBe(true);
    }
    expect(original.map(t => t.slug)).toEqual(before);
    expect(rankTreatments([{ ...original[0], name: "Z" }, { ...original[0], name: "A" }], "effectiveness")[0].name).toBe("A");
  });

  it.each(["unknown", "../conditions", "../../manifest", "constructor", "__proto__"])(
    "does not import an unknown or unsafe condition path: %s", async value => {
      expect(await getConditionEstimate(value)).toBeNull();
    },
  );

  it.each(["duplicate", "score-range", "missing-name", "missing-score"])(
    "rejects unusable source data: %s", failure => {
      const raw = readSource("treatments/depression.json");
      if (failure === "duplicate") raw.treatments.push(raw.treatments[0]);
      if (failure === "score-range") raw.treatments[0].safetyScore = 101;
      if (failure === "missing-name") delete raw.treatments[0].name;
      if (failure === "missing-score") delete raw.treatments[0].effectiveness;
      expect(conditionTreatmentsSchema.safeParse(raw).success).toBe(false);
    },
  );

  it("preserves missing outcomes rather than converting them to zero", () => {
    const raw = readSource("treatments/depression.json");
    delete raw.treatments[0].primaryOutcomes[0].percentageChange;
    expect(conditionTreatmentsSchema.parse(raw).treatments[0].primaryOutcomes![0].percentageChange).toBeUndefined();
    expect(treatmentSlug("St. John's Wort")).toBe("st-johns-wort");
  });
});
