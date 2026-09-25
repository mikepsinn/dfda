import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Accelerating Discovery
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              FDA v2: Making Clinical Trials <span className="text-primary">80X Cheaper</span> & More Accessible
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              The new decentralized autonomous FDA dramatically reduces costs through decentralization, automation, and
              economies of scale while improving patient access to innovative treatments.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm md:text-base">
                  <span className="font-bold">93% reduction</span> in patient travel burden
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm md:text-base">
                  <span className="font-bold">85% faster</span> trial launch time
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm md:text-base">
                  <span className="font-bold">Over $40,000</span> savings per participant
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/research-partner/create-trial">
                <Button size="lg" className="w-full sm:w-auto gap-1 text-base">
                  Create a Trial <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/patient/find-trials">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-1 text-base">
                  Find a Trial <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              Trusted by leading research institutions and pharmaceutical companies
            </div>
          </div>

          <div className="relative rounded-xl border bg-background p-6 shadow-lg">
            <div className="absolute -top-3 -right-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              FDA v2 Approach
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Traditional FDA vs. FDA v2</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Metric</div>
                  <div className="font-medium text-muted-foreground">Traditional FDA</div>
                  <div className="font-medium text-primary">FDA v2</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                  <div>Cost per Patient</div>
                  <div className="text-muted-foreground">$41,000</div>
                  <div className="text-primary font-bold">~$513</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                  <div>Time to Launch</div>
                  <div className="text-muted-foreground">6-12 months</div>
                  <div className="text-primary font-bold">2-4 weeks</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                  <div>Patient Access %</div>
                  <div className="text-muted-foreground">15%</div>
                  <div className="text-primary font-bold">100%</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm border-t pt-2">
                  <div>Data Quality</div>
                  <div className="text-muted-foreground">Variable</div>
                  <div className="text-primary font-bold">High</div>
                </div>
              </div>

              <Link href="/impact" 
              className="text-sm text-primary hover:underline inline-flex items-center">
                See full impact analysis <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

