import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { createLogger } from "@/lib/logger"
import { Suspense } from "react"
import { PatientOnboardingTreatmentsForm } from "@/components/patient/PatientOnboardingTreatmentsForm"

const logger = createLogger("patient-onboarding-treatments-page")

export default async function PatientOnboardingTreatmentsPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  logger.info("Rendering treatment onboarding page", { userId: user.id })

  return (
    <div className="container mx-auto max-w-2xl py-12">
       <h2 className="text-2xl font-semibold mb-6">Add Your Treatments</h2>
      <Suspense fallback={<p>Loading treatments step...</p>}>
         <PatientOnboardingTreatmentsForm userId={user.id} />
      </Suspense>
    </div>
  )
} 