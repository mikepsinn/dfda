import { HeroSection } from "@/components/HeroSection";
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection";
import { GetInvolvedSection } from "@/components/GetInvolvedSection";
import { ReferendumSection } from "@/components/ReferendumSection";
import { conditionCatalog } from "@/lib/demo/treatment-estimates";
import { getLandingOutcomeLabel, getRankingsPreview } from "@/lib/demo/landing-preview";

export default async function Home() {
  // Both read local snapshot files; neither makes a database or model call.
  const [rankingsPreview, outcomeLabelExample] = await Promise.all([
    getRankingsPreview(),
    getLandingOutcomeLabel(),
  ]);
  const conditionIndex = conditionCatalog.map(({ slug, name, synonyms }) => ({ slug, name, synonyms }));

  return (
    <>
      <HeroSection />
      <ComparativeEffectivenessSection preview={rankingsPreview} conditionIndex={conditionIndex} />
      <OutcomeLabelsSection example={outcomeLabelExample} />
      <HowItWorksSection />
      <KeyBenefitsSection />
      <GetInvolvedSection />
      <ReferendumSection />
    </>
  );
}
