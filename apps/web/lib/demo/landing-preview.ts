import { logger } from "@/lib/logger";
import { getTrialComparisons } from "@/lib/evidence/trial-comparisons";
import { getConditionEstimate, outcomeLabelHref, rankTreatments } from "./treatment-estimates";

// Example conditions for the landing-page preview; every condition stays searchable.
export const previewConditionSlugs = ["depression", "insomnia", "diabetes-mellitus-type-2", "hypertension", "migraine"];
const previewLimit = 5;

// The landing label uses the one treatment with a posted, source-backed trial comparison.
const exampleLabel = { condition: "insomnia", treatment: "suvorexant" };

export async function getRankingsPreview() {
  const conditions = await Promise.all(previewConditionSlugs.map(slug => getConditionEstimate(slug)));
  return conditions.flatMap((condition, index) => {
    if (!condition) {
      logger.error("Landing preview condition is missing from the snapshot", { slug: previewConditionSlugs[index] });
      return [];
    }
    return [{
      slug: condition.slug,
      name: condition.name,
      treatmentCount: condition.treatments.length,
      treatments: rankTreatments(condition.treatments, "effectiveness").slice(0, previewLimit).map(treatment => ({
        slug: treatment.slug,
        name: treatment.name,
        effectiveness: treatment.effectiveness,
        safetyScore: treatment.safetyScore,
        href: outcomeLabelHref(condition.slug, treatment.slug),
      })),
    }];
  });
}

export type RankingsPreviewCondition = Awaited<ReturnType<typeof getRankingsPreview>>[number];

export async function getLandingOutcomeLabel() {
  const condition = await getConditionEstimate(exampleLabel.condition);
  const treatment = condition?.treatments.find(item => item.slug === exampleLabel.treatment);
  if (!condition || !treatment) {
    logger.error("Landing Outcome Label example is missing from the snapshot", exampleLabel);
    return null;
  }
  const [trial] = getTrialComparisons(condition.slug, treatment.slug);
  return {
    conditionName: condition.name,
    treatment,
    href: outcomeLabelHref(condition.slug, treatment.slug),
    trialNctId: trial?.nctId ?? null,
  };
}

export type LandingOutcomeLabel = NonNullable<Awaited<ReturnType<typeof getLandingOutcomeLabel>>>;
