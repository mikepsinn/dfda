import { HeroSection } from "@/components/HeroSection";
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection";
import { ExplainerVideoSection } from "@/components/ExplainerVideoSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";
import { getLandingOutcomeLabel, getRankingsPreview } from "@/lib/demo/landing-preview";
import { resolveInstance } from "@/lib/instance/resolve";

export default async function Home() {
  const instance = await resolveInstance();
  // The previews read local snapshot files; neither makes a database or model call.
  const [rankingsPreview, outcomeLabelExample] = await Promise.all([
    getRankingsPreview(),
    getLandingOutcomeLabel(),
  ]);
  const conditionIndex = conditionCatalog.map(({ slug, name, synonyms }) => ({ slug, name, synonyms }));

  return (
    <>
      <HeroSection instance={instance} />
      <ExplainerVideoSection />
      <ComparativeEffectivenessSection preview={rankingsPreview} conditionIndex={conditionIndex} />
      <OutcomeLabelsSection example={outcomeLabelExample} />
      <HowItWorksSection />
      <KeyBenefitsSection />
    </>
  );
}
