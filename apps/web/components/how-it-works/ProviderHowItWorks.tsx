import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ProviderSteps } from "./ProviderSteps"

export function ProviderHowItWorks() {
  return (
    <div className="relative mt-12 mb-16"
      id="how-it-works-provider"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-center mb-8">How it Works For Providers</h3>

        <ProviderSteps />

        <div className="flex flex-col md:flex-row justify-center items-center mt-12 space-y-4 md:space-y-0 md:space-x-4">
          <Link href="/auth/signup?role=provider" className="w-full md:w-auto">
            <Button size="lg" className="gap-1 w-full md:w-auto">
              Register Your Institution <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login?role=provider" className="w-full md:w-auto">
            <Button size="lg" variant="outline" className="gap-1 w-full md:w-auto">
              Provider Login <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 