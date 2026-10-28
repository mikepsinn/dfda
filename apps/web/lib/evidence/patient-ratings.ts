import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";

const count = z.number().int().nonnegative();
// Only the fields this view uses; averageEffect is dropped because its meaning is unknown
// (see data/crowdsourcing-cures-ratings/README.md).
const ratingSchema = z.object({
  condition: z.string().min(1),
  treatmentId: z.number().int(),
  treatment: z.string().min(1),
  majorImprovement: count,
  moderateImprovement: count,
  noEffect: count,
  worse: count,
  muchWorse: count,
  popularity: count,
}).refine(r => r.popularity === r.majorImprovement + r.moderateImprovement + r.noEffect + r.worse + r.muchWorse,
  "popularity must equal the total of the five vote counts");

export const ratingLevels = [
  { key: "majorImprovement", label: "Major improvement", short: "Major" },
  { key: "moderateImprovement", label: "Moderate improvement", short: "Moderate" },
  { key: "noEffect", label: "No effect", short: "No effect" },
  { key: "worse", label: "Worse", short: "Worse" },
  { key: "muchWorse", label: "Much worse", short: "Much worse" },
] as const;

export type RatingLevel = (typeof ratingLevels)[number]["key"];

// Lower bound of the 95% Wilson interval for a proportion. Ranking by it keeps a treatment with
// two improvement ratings out of two from outranking one with 900 out of 1,000.
export function wilsonLowerBound(successes: number, total: number, z = 1.96) {
  if (total === 0) return 0;
  const p = successes / total;
  const z2 = z * z;
  return (p + z2 / (2 * total) - z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / (1 + z2 / total);
}

function toView(row: z.infer<typeof ratingSchema>) {
  const improved = row.majorImprovement + row.moderateImprovement;
  return {
    id: row.treatmentId,
    name: row.treatment.trim(),
    counts: Object.fromEntries(ratingLevels.map(({ key }) => [key, row[key]])) as Record<RatingLevel, number>,
    total: row.popularity,
    improvedShare: improved / row.popularity,
    rankScore: wilsonLowerBound(improved, row.popularity),
  };
}

export type PatientRating = ReturnType<typeof toView>;
export type PatientRatingGroup = { condition: string; total: number; treatments: PatientRating[] };

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

// Catalog names and synonyms, each mapped to the one condition it names, or null when it names several.
const catalogSlugByName = new Map<string, string | null>();
for (const { slug, name, synonyms } of conditionCatalog) {
  for (const key of new Set([name, ...synonyms].map(normalize))) {
    catalogSlugByName.set(key, catalogSlugByName.has(key) ? null : slug);
  }
}

let groupsBySlug: Map<string, PatientRatingGroup[]> | undefined;

function loadGroups() {
  if (groupsBySlug) return groupsBySlug;
  const rows = readFileSync(join(process.cwd(), "data", "crowdsourcing-cures-ratings", "treatment-ratings.jsonl"), "utf8")
    .trimEnd().split("\n").map(line => ratingSchema.parse(JSON.parse(line)));
  const rowsByCondition = new Map<string, typeof rows>();
  for (const row of rows) {
    const conditionRows = rowsByCondition.get(row.condition);
    if (conditionRows) conditionRows.push(row);
    else rowsByCondition.set(row.condition, [row]);
  }

  const groups = new Map<string, PatientRatingGroup[]>();
  for (const [condition, conditionRows] of rowsByCondition) {
    const slug = catalogSlugByName.get(normalize(condition));
    if (!slug) continue;
    // Each source condition stays its own group: counts from differently named conditions are never merged.
    const treatments = conditionRows.filter(row => row.popularity > 0).map(toView)
      .sort((a, b) => b.rankScore - a.rankScore || b.total - a.total || a.name.localeCompare(b.name, "en"));
    const group = { condition, total: treatments.reduce((sum, t) => sum + t.total, 0), treatments };
    groups.set(slug, [...(groups.get(slug) ?? []), group].sort((a, b) => b.total - a.total));
  }
  return groupsBySlug = groups;
}

// Patient ratings for a rankings-catalog condition, one group per matching source condition.
export function getPatientRatings(conditionSlug: string): PatientRatingGroup[] {
  return loadGroups().get(conditionSlug) ?? [];
}
