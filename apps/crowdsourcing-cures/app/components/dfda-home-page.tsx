import AdvancedTrialSearch from "@/app/trials/components/AdvancedTrialSearch"
import ProblemsWithCurrentSystem from "@/app/docs/disease-eradication-act/components/problems-with-the-current-system"
import { NewsletterSection } from "@/components/landingPage/NewsletterSection"

import BenefitStatisticsGrid from "./BenefitStatisticsGrid"
import CitizenScienceSection from "./CitizenScienceSection"
import DFDAComparisonTable from "./DFDAComparisonTable"
import DFDACostSavingsTable from "./DFDACostSavingsTable"
import DFDAFeatureGrid from "./dfda-feature-grid"
import HowItWorksSection from "./HowItWorksSection"
import ProblemStatisticsGrid from "./ProblemStatisticsGrid"
import SolutionSection from "./SolutionSection"
import VariableStudySearchSections from "./variable-study-search-sections"

export default function DFDAHomePage() {
  return (
    <div>
      <header className="neobrutalist-container mb-12">
        <h1 className="neobrutalist-hero-title">We Can Eradicate Disease</h1>
        <p className="neobrutalist-description">
          🚀 by giving all patients the right to effortlessly participate in
          global decentralized clinical research 💊
        </p>
      </header>

      <main className="space-y-12">
        <section className="neobrutalist-gradient-container neobrutalist-gradient-green mb-12">
          <h2 className="neobrutalist-title mb-6">Problems We Can Solve</h2>
          <p className="neobrutalist-description mb-6">
            To have any hope of eradicating disease, we first need to solve the
            following problems:
          </p>
          <ProblemStatisticsGrid />
        </section>

        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink mb-12">
          <h2 className="neobrutalist-title mb-6">
            The World We Can Create 🌍
          </h2>
          <p className="neobrutalist-description mb-6">
            If we gave every patient the right to effortlessly participate in
            decentralized clinical trials, we could achieve:
          </p>
          <BenefitStatisticsGrid />
        </section>

        <HowItWorksSection />
        <DFDAComparisonTable />

        <section className="mt-12">
          <DFDACostSavingsTable />
        </section>

        <ProblemsWithCurrentSystem />
        <VariableStudySearchSections />

        <section className="neobrutalist-gradient-container neobrutalist-gradient-green">
          <h2 className="neobrutalist-title">Join Clinical Trials 🔬</h2>
          <p className="neobrutalist-description mb-6">
            Find and instantly join trials for the most promising treatments
          </p>
          <AdvancedTrialSearch />
        </section>

        <DFDAFeatureGrid />
        <SolutionSection />
        <CitizenScienceSection />
        <NewsletterSection />
      </main>
    </div>
  )
}
