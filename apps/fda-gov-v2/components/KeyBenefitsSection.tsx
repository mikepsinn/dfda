import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function KeyBenefitsSection() {
  return (
    <section id="key-benefits" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Benefits</h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Our platform delivers measurable advantages for both sponsors and patients
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-primary"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Improved Patient Experience</h3>
            <div className="mt-2 text-muted-foreground">
              <p className="mb-2">93% reduction in travel burden</p>
              <p className="mb-2">85% of patients prefer remote participation</p>
              <p>Personalized health insights for every participant</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-primary"
              >
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Dramatic Cost Reduction</h3>
            <div className="mt-2 text-muted-foreground">
              <p className="mb-2">80X cheaper than traditional trials</p>
              <p className="mb-2">$15,000+ savings per participant</p>
              <p>70% reduction in administrative overhead</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-primary"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Better Data Quality</h3>
            <div className="mt-2 text-muted-foreground">
              <p className="mb-2">40% more complete data collection</p>
              <p className="mb-2">Real-time monitoring reduces errors by 65%</p>
              <p>Advanced analytics reveal hidden patterns</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl rounded-lg border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-primary"
              >
                <path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"></path>
                <path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"></path>
                <path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"></path>
                <path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold">Accelerated Innovation</h3>
            <p className="text-muted-foreground">
              Our platform enables trials to launch 85% faster and complete 60% sooner than traditional methods,
              accelerating the pace of medical innovation and getting treatments to patients who need them faster.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/sponsor/create-trial">
                <Button size="lg" className="gap-1">
                  Create a Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/patient/find-trials">
                <Button size="lg" variant="outline" className="gap-1">
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

