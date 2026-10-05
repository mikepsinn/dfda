import { ArrowRight, Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RankingsPreview } from "@/components/demo/rankings-preview"
import { treatmentOutcomeCategories } from "@/components/demo/treatment-outcomes"
import { PatientSteps } from "@/components/how-it-works/PatientSteps"
import { ProviderSteps } from "@/components/how-it-works/ProviderSteps"
import { ResearchPartnerSteps } from "@/components/how-it-works/ResearchPartnerSteps"
import { BenefitCards } from "@/components/KeyBenefitsSection"
import { LearningLoop } from "@/components/LearningLoop"
import { OutcomeLabel } from "@/components/OutcomeLabel"
import type { LandingOutcomeLabel, RankingsPreviewCondition } from "@/lib/demo/landing-preview"

// The institute's page shows the home page's sections as an illustration of how a global Open
// Treatment Evidence Network would work for patients, without links into the app. Keep the layout
// in step with the home page's sections (HeroSection, ComparativeEffectivenessSection,
// OutcomeLabelsSection, HowItWorksSection and KeyBenefitsSection).

const highlights = [
  "Treatment rankings based on real-world outcomes",
  "An Outcome Label for every treatment",
  "Patient data that stays with patients and their clinics",
]

export function InstituteHero() {
  return (
    <section className="band-muted-fade -mt-6 w-full py-12 md:-mt-10 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Our mission</div>
            <h1 className="text-3xl font-bold tracking-tighter min-[380px]:text-4xl sm:text-5xl lg:text-4xl xl:text-5xl">
              Ensure every patient can participate in clinical trials for the{" "}
              <span className="text-primary">most promising treatments</span>
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              This is how your doctor&apos;s visit should actually work, with a global Open Treatment Evidence
              Network.
            </p>
            <ul className="space-y-4">
              {highlights.map(highlight => (
                <li key={highlight} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm md:text-base">{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full gap-1 text-base sm:w-auto">
                <a href="#partner-form">Partner with us <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full gap-1 text-base sm:w-auto">
                <a href="#how-it-works">See how it should actually work <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
          <LearningLoop />
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ title, children }: { title: string; children: string }) {
  return (
    <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
      <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">{children}</p>
    </div>
  )
}

export function RankingsIllustration({ preview }: { preview: RankingsPreviewCondition[] }) {
  if (preview.length === 0) return null
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <SectionHeading title="Comparative Effectiveness Rankings">
          Patients and doctors would see which treatments worked best for people with the same condition
        </SectionHeading>
        <div className="mx-auto mt-8 max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Interventions by Condition</CardTitle>
              <CardDescription className="mt-1.5">
                An example using today&apos;s estimates. With the network, rankings would update as patients report
                outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankingsPreview conditions={preview} links={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

const labelFeatures = [
  "Comprehensive health impact data",
  "Both positive and negative effects",
  "Evidence-based decision making",
]

export function OutcomeLabelIllustration({ example }: { example: LandingOutcomeLabel | null }) {
  if (!example) return null
  return (
    <section className="band-muted w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Outcome Labels</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              Every treatment would have a label showing its effects on all measurable aspects of health
            </p>
            <ul className="grid gap-2">
              {labelFeatures.map(feature => (
                <li key={feature} className="flex items-center gap-2">
                  <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <OutcomeLabel title={example.treatment.name} tag={example.conditionName}
            subtitle="An example using today's estimates. Changes are relative to the baselines shown."
            data={treatmentOutcomeCategories(example.treatment)} showBars={false} />
        </div>
      </div>
    </section>
  )
}

const audiences = [
  { id: "how-it-works-patient", title: "For Patients", steps: <PatientSteps /> },
  { id: "how-it-works-provider", title: "For Providers", steps: <ProviderSteps /> },
  { id: "how-it-works-research-partner", title: "For Research Partners", steps: <ResearchPartnerSteps /> },
]

export function HowItWouldWorkSection() {
  return (
    <section id="how-it-works" className="w-full scroll-mt-16 py-12 md:py-24 lg:py-32">
      {/* The page container already pads phones; the wide mock-ups need that width. */}
      <div className="container px-0 sm:px-4 md:px-6">
        <SectionHeading title="How Your Doctor's Visit Should Actually Work">
          Patients would report outcomes, clinicians would see what has worked for patients like theirs, and
          research partners would run trials on the same network.
        </SectionHeading>
        {audiences.map(audience => (
          <div key={audience.id} id={audience.id} className="relative mb-16 mt-12">
            <div className="mx-auto max-w-5xl">
              <h3 className="mb-8 text-center text-2xl font-bold">{audience.title}</h3>
              {audience.steps}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function BenefitsSection() {
  return (
    <section id="benefits" className="band-fade w-full scroll-mt-16 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <SectionHeading title="Why Care-Integrated Clinical Trials Matter">
          What the network would deliver for patients, clinicians and researchers
        </SectionHeading>
        <BenefitCards links={false} />
      </div>
    </section>
  )
}
