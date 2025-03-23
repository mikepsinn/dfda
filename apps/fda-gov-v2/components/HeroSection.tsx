import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Revolutionizing Clinical Trials Through Decentralization
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Join the platform making clinical trials 80X cheaper through automation, decentralization, competition,
              and economies of scale.
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
              <Link href="/developers">
                <Button size="lg" variant="ghost" className="gap-1">
                  Developer API <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-lg border bg-background p-8">{/* Platform benefits content */}</div>
        </div>
      </div>
    </section>
  )
}

