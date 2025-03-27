import { SponsorHowItWorks } from "./how-it-works/SponsorHowItWorks"
import { PatientHowItWorks } from "./how-it-works/PatientHowItWorks"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-primary">Simple & Streamlined Process</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            How the Decentralized FDA Works
          </h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            The Decentralized FDA connects trial sponsors with patients through an intuitive, streamlined process
          </p>
        </div>

        <SponsorHowItWorks />

        <PatientHowItWorks />
      </div>
    </section>
  )
}

