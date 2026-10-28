import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/data/crowdsourcing-cures-ratings/manifest.json";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";
import { getPatientRatings, wilsonLowerBound } from "@/lib/evidence/patient-ratings";

const directory = resolve(process.cwd(), "data/crowdsourcing-cures-ratings");
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const allGroups = () => conditionCatalog.flatMap(c => getPatientRatings(c.slug));

describe("Crowdsourcing Cures patient ratings", () => {
  it("matches its snapshot manifest byte for byte", () => {
    expect(manifest.source).toBe("Crowdsourcing Cures Aggregated Self-Reported Patient Ratings");
    for (const file of manifest.files) {
      const text = readFileSync(resolve(directory, file.path), "utf8");
      expect(sha256(text), file.path).toBe(file.sha256);
      expect(text.split("\n").length - 1, file.path).toBe(file.rows);
    }
  });

  it("matches rated conditions to the rankings catalog by name or synonym", () => {
    expect(conditionCatalog.filter(c => getPatientRatings(c.slug).length > 0)).toHaveLength(42);
    expect(getPatientRatings("depression").map(g => g.condition)).toEqual(["Depression"]);
    expect(getPatientRatings("gerd").map(g => g.condition)).toEqual(["Heartburn"]);
    // Differently named source conditions stay separate, largest first.
    expect(getPatientRatings("anxiety-disorder").map(g => g.condition))
      .toEqual(["Anxiety", "Generalized Anxiety Disorder"]);
    expect(getPatientRatings("unknown")).toEqual([]);
  });

  it("lists only rated treatments, ranked by the lower bound of the improvement share", () => {
    for (const group of allGroups()) {
      expect(group.treatments.length, group.condition).toBeGreaterThan(0);
      expect(group.treatments.every(t => t.total > 0 && t.name === t.name.trim())).toBe(true);
      expect(group.total).toBe(group.treatments.reduce((sum, t) => sum + t.total, 0));
      group.treatments.slice(1).forEach((t, i) =>
        expect(group.treatments[i].rankScore).toBeGreaterThanOrEqual(t.rankScore));
    }
    expect(wilsonLowerBound(2, 2)).toBeLessThan(wilsonLowerBound(900, 1000));
    expect(wilsonLowerBound(900, 1000)).toBeCloseTo(0.88, 2);
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });
});
