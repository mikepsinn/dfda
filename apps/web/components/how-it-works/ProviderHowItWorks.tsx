import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ProviderSteps } from "./ProviderSteps"

export function ProviderHowItWorks() {
  return (
    <div className="relative mt-12 mb-16"
      id="how-it-works-provider"
    >
      <div className="mx-auto max-w-5xl">
        <h3 className="text-2xl font-bold text-center mb-8">How it Works For Providers</h3>

        <ProviderSteps />

        <div className="flex flex-col md:flex-row justify-center items-center mt-12 space-y-4 md:space-y-0 md:space-x-4">
          <Button asChild size="lg" className="gap-1 w-full md:w-auto">
            <Link href="/register">
              Register Your Institution <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-1 w-full md:w-auto">
            <Link href="/login">
              Provider Login <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
