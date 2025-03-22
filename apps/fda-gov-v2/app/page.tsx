import { HeroSection } from "@/components/HeroSection"
import { ComparativeEffectivenessSection } from "@/components/ComparativeEffectivenessSection"
import { HowItWorksSection } from "@/components/HowItWorksSection"
import { KeyBenefitsSection } from "@/components/KeyBenefitsSection"
import { RevolutionizingMedicalProgressSection } from "@/components/RevolutionizingMedicalProgressSection"
import { OutcomeLabelsSection } from "@/components/OutcomeLabelsSection"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <ComparativeEffectivenessSection />
        <HowItWorksSection />
        <KeyBenefitsSection />
        <RevolutionizingMedicalProgressSection />
        <OutcomeLabelsSection />
      </main>
    </div>
  )
}

