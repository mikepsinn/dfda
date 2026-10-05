import type { Metadata } from "next"
import { ExplainerVideoSection } from "@/components/ExplainerVideoSection"
import { InstituteFooter, InstituteHeader } from "@/components/institute/InstituteChrome"
import {
  BenefitsSection,
  HowItWouldWorkSection,
  InstituteHero,
  OutcomeLabelIllustration,
  RankingsIllustration,
} from "@/components/institute/InstituteSections"
import { PartnersSection } from "@/components/institute/PartnersSection"
import { getLandingOutcomeLabel, getRankingsPreview } from "@/lib/demo/landing-preview"

const description =
  "Our mission is to ensure every patient can participate in clinical trials for the most promising treatments."

export const metadata: Metadata = {
  title: "Institute for Accelerated Medicine",
  description,
  openGraph: { title: "Institute for Accelerated Medicine", description },
  // A draft of the acceleratedmedicine.org home page; it should be indexed there, not here.
  robots: { index: false, follow: true },
}

export default async function InstitutePage() {
  // Both read local snapshot files; neither makes a database or model call.
  const [rankingsPreview, outcomeLabelExample] = await Promise.all([
    getRankingsPreview(),
    getLandingOutcomeLabel(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <InstituteHeader />
      {/* The same page container as the app's other pages (SiteChrome), so the sections match the home page. */}
      <main className="w-full flex-1 bg-background py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-6">
          <InstituteHero />
          <ExplainerVideoSection />
          <RankingsIllustration preview={rankingsPreview} />
          <OutcomeLabelIllustration example={outcomeLabelExample} />
          <HowItWouldWorkSection />
          <BenefitsSection />
          <PartnersSection />
        </div>
      </main>
      <InstituteFooter />
    </div>
  )
}
