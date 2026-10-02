import { cache } from "react";
import { z } from "zod";
import conditions from "@/data/optimitron/medical-data/conditions.json";
import index from "@/data/optimitron/medical-data/treatments/index.json";
import manifest from "@/data/optimitron/manifest.json";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const score = z.number().finite().min(0).max(100);
const amount = z.number().finite().nullish();
const healthEconomics = z.object({
  annualCostOfCare: z.object({
    drugCost: amount,
    monitoringCost: amount,
    sideEffectManagement: amount,
    totalAnnual: amount,
  }).passthrough().nullish(),
  costPerRemission: amount,
  costPerResponder: amount,
  icer: amount,
  qalysGained: amount,
  vsComparator: z.object({
    comparatorName: z.string(),
    costDifference: amount,
    qalysGainedDifference: amount,
  }).passthrough().nullish(),
}).passthrough();
const outcome = z.object({
  name: z.string().min(1),
  baseline: z.string().nullish(),
  percentageChange: z.number().finite().nullish(),
  absoluteChange: z.string().nullish(),
  dataSource: z.string().nullish(),
  isPositive: z.boolean().optional(),
}).passthrough();

// Validate fields consumed by this view. Other source fields remain intact. Only values
// with a checked sourceUrl (see data/optimitron/corrections.json) count as verified.
export const sourceTreatmentSchema = z.object({
  name: z.string().min(1),
  effectiveness: score,
  safetyScore: score,
  dosageRange: z.string().nullish(),
  timeToEffect: z.string().nullish(),
  treatmentDuration: z.string().nullish(),
  healthEconomics: healthEconomics.nullish(),
  primaryOutcomes: z.array(outcome).optional(),
  secondaryOutcomes: z.array(outcome).optional(),
  sideEffects: z.array(z.object({
    name: z.string().min(1), percentage: score.nullish(),
  }).passthrough()).optional(),
}).passthrough();

export const conditionTreatmentsSchema = z.object({
  conditionName: z.string().min(1),
  dataSource: z.string(),
  lastUpdated: z.string().datetime(),
  treatments: z.array(sourceTreatmentSchema).min(1),
}).passthrough().superRefine((value, context) => {
  if (new Set(value.treatments.map(t => treatmentSlug(t.name))).size !== value.treatments.length) {
    context.addIssue({ code: "custom", message: "Duplicate treatment slug" });
  }
});

const conditionSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string(),
  synonyms: z.array(z.string()),
  icd10Codes: z.string().nullable(),
}).passthrough();

export const conditionCatalog = z.array(conditionSchema).parse(conditions)
  .sort((a, b) => a.name.localeCompare(b.name, "en"));
const conditionBySlug = new Map(conditionCatalog.map(c => [c.slug, c]));
const available = new Set(z.array(slug).parse(index.conditions));
if (conditionBySlug.size !== conditionCatalog.length || available.size !== conditionCatalog.length ||
  conditionCatalog.some(c => !available.has(c.slug))) {
  throw new Error("Medical condition indexes do not agree");
}

export const medicalSnapshot = { ...manifest, origin: manifest.displayOrigin };
export const estimateLabel = "Current best estimates";

// Matches Optimitron's medicalNameToSlug convention (including apostrophes).
export function treatmentSlug(name: string) {
  return name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toView(treatment: z.infer<typeof sourceTreatmentSchema>) {
  return {
    ...treatment,
    slug: treatmentSlug(treatment.name),
    primaryOutcomes: treatment.primaryOutcomes ?? [],
    secondaryOutcomes: treatment.secondaryOutcomes ?? [],
    sideEffects: treatment.sideEffects ?? [],
  };
}

export type TreatmentEstimate = ReturnType<typeof toView>;

export const getConditionEstimate = cache(async (conditionSlug: string) => {
  const condition = conditionBySlug.get(conditionSlug);
  // Allowlist before import; unknown paths must never read other files.
  if (!condition || !available.has(conditionSlug)) return null;
  const source = await import(`../../data/optimitron/medical-data/treatments/${conditionSlug}.json`);
  const data = conditionTreatmentsSchema.parse(source.default);
  if (data.conditionName !== condition.name) throw new Error(`Condition name mismatch: ${conditionSlug}`);
  return {
    ...condition,
    ...data,
    origin: "model-estimate" as const,
    sourcePath: `${manifest.root}/treatments/${conditionSlug}.json`,
    treatments: data.treatments.map(toView),
  };
});

export type DemoCondition = NonNullable<Awaited<ReturnType<typeof getConditionEstimate>>>;

export function rankTreatments(treatments: TreatmentEstimate[], sort: string) {
  const metric = sort === "safety" ? "safetyScore" : "effectiveness";
  return [...treatments].sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name, "en"));
}

export function outcomeLabelHref(condition: string, treatment: string) {
  return `/outcome-labels/demo/${condition}/${treatment}`;
}

export function sourceHref(condition: DemoCondition) {
  return `https://github.com/${manifest.repository}/blob/${manifest.ref}/${condition.sourcePath}`;
}
