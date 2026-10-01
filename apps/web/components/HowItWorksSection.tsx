import { ResearchPartnerHowItWorks } from "./how-it-works/ResearchPartnerHowItWorks"
import { PatientHowItWorks } from "./how-it-works/PatientHowItWorks"
import { ProviderHowItWorks } from "./how-it-works/ProviderHowItWorks"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      {/* The page container already pads phones; the wide mock-ups need that width. */}
      <div className="container px-0 sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Patients report outcomes, clinicians see what has worked for patients like theirs, and research partners
            run trials on the same network.
          </p>
        </div>

        <PatientHowItWorks />

        <ProviderHowItWorks />

        <ResearchPartnerHowItWorks />
      </div>
    </section>
  )
}
