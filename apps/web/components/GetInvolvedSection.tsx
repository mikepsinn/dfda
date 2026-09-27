import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GetInvolvedSection() {
  return (
    <section className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl rounded-lg border bg-background p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Help Build It</h2>
            <p className="text-muted-foreground">
              dFDA is in early development. Track your treatments, rate what works for you, or help build the software.
            </p>
            <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2">
                <Link href="/register">
                  Start Tracking <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Link href="/developers">
                  For Developers <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
