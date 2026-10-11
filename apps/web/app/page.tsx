import { HeroSection } from "@/components/HeroSection";
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection";
import { ExplainerVideoSection } from "@/components/ExplainerVideoSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";
import { getLandingOutcomeLabel, getRankingsPreview } from "@/lib/demo/landing-preview";
import { resolveInstance } from "@/lib/instance/resolve";
import { logger } from "@/lib/logger";
import { listPrograms, type Program } from "@/lib/programs/data";
import { ProgramsSection } from "@/components/programs/ProgramsSection";

/** The programs of the instance; a failed read shows the page without them. */
async function instancePrograms(instanceSlug: string): Promise<Program[]> {
  try {
    return await listPrograms(instanceSlug);
  } catch (error) {
    logger.error("Could not read the programs of the instance", {
      instanceSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export default async function Home() {
  const instance = await resolveInstance();
  // The previews read local snapshot files; neither makes a database or model call.
  const [rankingsPreview, outcomeLabelExample, programs] = await Promise.all([
    getRankingsPreview(),
    getLandingOutcomeLabel(),
    instance ? instancePrograms(instance.slug) : [],
  ]);
  const conditionIndex = conditionCatalog.map(({ slug, name, synonyms }) => ({ slug, name, synonyms }));

  return (
    <>
      <HeroSection instance={instance} />
      <ProgramsSection programs={programs} />
      <ExplainerVideoSection />
      <ComparativeEffectivenessSection preview={rankingsPreview} conditionIndex={conditionIndex} />
      <OutcomeLabelsSection example={outcomeLabelExample} />
      <HowItWorksSection />
      <KeyBenefitsSection />
    </>
  );
}
