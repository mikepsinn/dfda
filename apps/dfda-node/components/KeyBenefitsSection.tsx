import Link from "next/link"
import { ArrowRight, DollarSign, Clock, LineChart, Users, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function KeyBenefitsSection() {
  return (
    <section id="key-benefits" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/50">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="text-primary">Why Choose Our Platform</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Benefits</h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            The Decentralized FDA delivers measurable advantages that transform the clinical trial experience
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <div className="flex flex-col h-full rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-4 w-fit">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Improved Patient Experience</h3>
            <div className="mt-2 text-muted-foreground flex-grow">
              <p className="mb-4">Our patient-centered approach makes participation easier and more rewarding:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>93% reduction in travel burden</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>85% of patients prefer remote participation</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>Personalized health insights for every participant</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link
                href="/app/(protected)/patient/find-trials"
                className="text-primary text-sm font-medium inline-flex items-center hover:underline"
              >
                Find a trial <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col h-full rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-4 w-fit">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Dramatic Cost Reduction</h3>
            <div className="mt-2 text-muted-foreground flex-grow">
              <p className="mb-4">The Decentralized FDA dramatically reduces the cost of clinical trials:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>80X cheaper than traditional trials</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>$15,000+ savings per participant</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>70% reduction in administrative overhead</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link
                href="/impact"
                className="text-primary text-sm font-medium inline-flex items-center hover:underline"
              >
                View cost analysis <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col h-full rounded-lg border bg-background p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-4 w-fit">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Better Data Quality</h3>
            <div className="mt-2 text-muted-foreground flex-grow">
              <p className="mb-4">The Decentralized FDA ensures higher quality data for better research outcomes:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>40% more complete data collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>Real-time monitoring reduces errors by 65%</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 6 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>Advanced analytics reveal hidden patterns</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link
                href="/developers"
                className="text-primary text-sm font-medium inline-flex items-center hover:underline"
              >
                Explore our API <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl mt-8">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mt-2 font-semibold">85% Faster</h4>
                <p className="text-sm text-muted-foreground">Trial launch time</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mt-2 font-semibold">98% Compliance</h4>
                <p className="text-sm text-muted-foreground">Regulatory standards</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mt-2 font-semibold">60% Sooner</h4>
                <p className="text-sm text-muted-foreground">Time to completion</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/app/(protected)/research-partner/create-trial">
                <Button size="lg" className="w-full sm:w-auto gap-1">
                  Create a Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/app/(protected)/patient/find-trials">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-1">
                  Find a Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

