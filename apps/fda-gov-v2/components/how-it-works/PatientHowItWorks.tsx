import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { PatientSteps } from "./PatientSteps"

export function PatientHowItWorks() {
  return (
    <div className="relative mt-12 mb-16">
      <div className="mx-auto max-w-5xl">
        <h3 className="text-2xl font-bold text-center mb-8">How it Works For Patients</h3>

        <PatientSteps />

        <div className="flex justify-center mt-12">
          <Link href="/patient/find-trials">
            <Button size="lg" variant="outline" className="gap-1">
              Find a Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

