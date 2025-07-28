import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ResearchPartnerSteps } from "./ResearchPartnerSteps"

export function ResearchPartnerHowItWorks() {
  return (
    <div 
    className="relative mt-12 mb-16"
    id="how-it-works-research-partner"
    >
      <div className="mx-auto max-w-5xl">
        <h3 className="text-2xl font-bold text-center mb-8">How it Works For Research Partners</h3>

        <ResearchPartnerSteps />

        <div className="flex justify-center mt-12">
          <Link href="/research-partner/create-trial">
            <Button size="lg" className="gap-1">
              Create a Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 