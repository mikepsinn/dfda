import { HeroSection } from "@/components/HeroSection";
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection";
import { ExplainerVideoSection } from "@/components/ExplainerVideoSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection";
import { InstanceHome } from "@/components/instance/InstanceHome";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";
import { getLandingOutcomeLabel, getRankingsPreview } from "@/lib/demo/landing-preview";
import { resolveInstance } from "@/lib/instance/resolve";
import { logger } from "@/lib/logger";
import { joinedProgramIds, listPrograms } from "@/lib/programs/data";
import { getServerUser } from "@/lib/server-auth";

/** The programs of the instance, and which of them the user joined; a failed read shows the page without them. */
async function instancePrograms(instanceSlug: string) {
  try {
    const [programs, user] = await Promise.all([listPrograms(instanceSlug), getServerUser()]);
    return { programs, joined: await joinedProgramIds(user, programs.map((program) => program.id)) };
  } catch (error) {
    logger.error("Could not read the programs of the instance", {
      instanceSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return { programs: [], joined: new Set<string>() };
  }
}

export default async function Home() {
  // A company instance has its own home page, without the network's sections.
  const instance = await resolveInstance();
  if (instance) return <InstanceHome instance={instance} {...await instancePrograms(instance.slug)} />;

  // The previews read local snapshot files; neither makes a database or model call.
  const [rankingsPreview, outcomeLabelExample] = await Promise.all([getRankingsPreview(), getLandingOutcomeLabel()]);
  const conditionIndex = conditionCatalog.map(({ slug, name, synonyms }) => ({ slug, name, synonyms }));

  return (
    <>
      <HeroSection />
      <ExplainerVideoSection />
      <ComparativeEffectivenessSection preview={rankingsPreview} conditionIndex={conditionIndex} />
      <OutcomeLabelsSection example={outcomeLabelExample} />
      <HowItWorksSection />
      <KeyBenefitsSection />
    </>
  );
}
