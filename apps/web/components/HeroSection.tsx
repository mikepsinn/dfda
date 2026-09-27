import Link from "next/link"
import { ArrowDown, ArrowRight, CheckCircle2, ClipboardList, Network, ShieldCheck, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"

const highlights = [
  "Treatment rankings based on real-world outcomes",
  "An Outcome Label for every treatment",
  "Patient data stays with patients and their clinics",
]

// The planned architecture from the repository README; federation is not built yet.
const dataFlow = [
  {
    name: "Digital Twin Safe",
    description: "The patient's own data",
    icon: ShieldCheck,
    handoff: "The patient shares it with their doctor",
  },
  {
    name: "Clinic Node",
    description: "Runs at the clinic",
    icon: Stethoscope,
    handoff: "Summary file: aggregates only",
  },
  {
    name: "Global Aggregator",
    description: "Combines summaries from many clinics",
    icon: Network,
  },
  {
    name: "Treatment Rankings + Outcome Labels",
    description: "Published for everyone",
    icon: ClipboardList,
  },
]

export function HeroSection() {
  return (
    <section className="band-muted-fade -mt-6 w-full py-12 md:-mt-10 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Accelerating Discovery
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Decentralized Framework for <span className="text-primary">Drug Assessment</span>
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Rank treatments by real-world outcomes and publish an Outcome Label for each one. dFDA is
              designed so patient records stay with patients and clinics, and only aggregate results are shared.
            </p>

            <ul className="space-y-4">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm md:text-base">{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto gap-1 text-base">
                <Link href="/treatment-rankings">
                  Compare treatments <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-1 text-base">
                <Link href="/#how-it-works">
                  See how it works <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative rounded-xl border bg-background p-6 shadow-lg">
            <div className="absolute -top-3 -right-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Planned architecture
            </div>
            <h2 className="text-xl font-bold">How the data flows</h2>
            <ol className="mt-6">
              {dataFlow.map((step) => (
                <li key={step.name}>
                  <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <step.icon aria-hidden="true" className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  {step.name !== dataFlow[dataFlow.length - 1].name && (
                    <div className="flex items-center gap-2 py-2 pl-7 text-xs text-muted-foreground">
                      <ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                      {step.handoff && <span>{step.handoff}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
