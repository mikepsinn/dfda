import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LearningLoop } from "./LearningLoop"
import type { InstanceBranding } from "@/lib/instance/config"

// On a company instance, the hero shows its name, tagline and products.
export function HeroSection({ instance }: { instance?: Pick<InstanceBranding, "name" | "tagline" | "products"> | null }) {
  return (
    <section className="band-muted-fade -mt-6 w-full py-12 md:-mt-10 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tighter min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              {instance ? (
                <span className="text-primary">{instance.name}</span>
              ) : (
                <>
                  Open Treatment <span className="text-primary">Evidence Network</span>
                </>
              )}
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              {instance
                ? instance.tagline ?? "Track your treatments and how you feel, and see what worked for people like you."
                : "Rank treatments by real-world outcomes and publish an Outcome Label for each one. The network is designed so patient records stay with patients and clinics, and only aggregate results are shared."}
            </p>

            {instance && instance.products.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Track your results with</p>
                <ul aria-label="Products" className="flex flex-wrap gap-2">
                  {instance.products.map((product) => (
                    <li key={product} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {instance && (
                <Button asChild size="lg" className="w-full sm:w-auto gap-1 text-base">
                  <Link href="/register">
                    Start tracking <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant={instance ? "outline" : "default"} className="w-full sm:w-auto gap-1 text-base">
                <Link href="/treatment-rankings">
                  Compare treatments <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              {!instance && (
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-1 text-base">
                  <Link href="/#how-it-works">
                    See how it works <ArrowRight aria-hidden="true" className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <LearningLoop />
        </div>
      </div>
    </section>
  )
}
