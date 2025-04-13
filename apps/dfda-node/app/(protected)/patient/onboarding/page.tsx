import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { createLogger } from "@/lib/logger"
import { Suspense } from "react"
import { PatientOnboardingForm } from "@/components/patient/PatientOnboardingForm"

const logger = createLogger("patient-onboarding-page")

export default async function PatientOnboardingPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // TODO: Add logic here to check if user has already completed onboarding
  // If completed, redirect to /patient dashboard
  // const isOnboardingComplete = await checkOnboardingStatus(user.id);
  // if (isOnboardingComplete) redirect("/patient");

  logger.info("Rendering patient onboarding page", { userId: user.id });

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Suspense fallback={<p>Loading onboarding...</p>}>
         <PatientOnboardingForm userId={user.id} />
      </Suspense>
    </div>
  )
} 