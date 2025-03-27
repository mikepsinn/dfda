import { getFeaturedTrials, getStatistics } from "@/lib/api/homepage";
import { HeroSection } from "@/components/HeroSection";
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection";
import { RevolutionizingMedicalProgressSection } from "@/components/RevolutionizingMedicalProgressSection";
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection";
import { FeaturedTrialsSection } from "@/components/FeaturedTrialsSection";

export default async function Home() {
  // Fetch data on the server
  const featuredTrials = await getFeaturedTrials();
  const statistics = await getStatistics();
  
  return (
    <>
      <HeroSection />
      <ComparativeEffectivenessSection />
      <OutcomeLabelsSection />
      <HowItWorksSection />
      <KeyBenefitsSection />
      <RevolutionizingMedicalProgressSection stats={statistics} />
      <FeaturedTrialsSection trials={featuredTrials as any} />
    </>
  );
}


