import snapshot from "@/data/evidence/NCT01097616.suvorexant-sleep.v1.json";
import { extractTrialComparison, trialSnapshotSchema } from "./clinical-trial-comparison";

const comparison = extractTrialComparison(trialSnapshotSchema.parse(snapshot).source);

export function getTrialComparisons(conditionSlug: string, treatmentSlug: string) {
  return comparison.conditionSlug === conditionSlug && comparison.treatmentSlug === treatmentSlug
    ? [comparison] : [];
}
