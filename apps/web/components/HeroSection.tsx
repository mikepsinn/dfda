import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LearningLoop } from "./LearningLoop"

export function HeroSection() {
  return (
    <section className="band-muted-fade -mt-6 w-full py-12 md:-mt-10 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tighter min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              Open Treatment <span className="text-primary">Evidence Network</span>
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Rank treatments by real-world outcomes and publish an Outcome Label for each one. The network is
              designed so patient records stay with patients and clinics, and only aggregate results are shared.
            </p>

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

          <LearningLoop />
        </div>
      </div>
    </section>
  )
}
