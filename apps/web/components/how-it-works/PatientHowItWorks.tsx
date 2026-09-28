import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { PatientSteps } from "./PatientSteps"

export function PatientHowItWorks() {
  return (
    <div className="relative mt-12 mb-16"
      id="how-it-works-patient"
    >
      <div className="mx-auto max-w-5xl">
        <h3 className="text-2xl font-bold text-center mb-8">How it Works For Patients</h3>

        <PatientSteps />

        <div className="flex justify-center mt-12">
          <Button asChild size="lg" variant="outline" className="gap-1">
            <Link href="/find-trials">
              Find a Trial <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
