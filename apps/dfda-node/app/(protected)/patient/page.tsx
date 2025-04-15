import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
// Remove Plus icon import if Button is removed or doesn't use it
// import { Plus } from "lucide-react"
import { HeartPulse, Pill } from "lucide-react" // Import icons for buttons
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
// Remove getRatingsByPatientAction import
// import { getRatingsByPatientAction } from "@/app/actions/treatment-ratings"
// Remove getTreatmentsForConditionAction import
// import { getTreatmentsForConditionAction } from "@/app/actions/treatments"
// Import actions for treatments and tasks
// import { getPatientTreatmentsAction } from "@/app/actions/patient-treatments"
import { getPendingReminderNotificationsAction } from "@/app/actions/reminder-schedules"
// Import the new list component (path might need adjustment)
// import { PatientConditionsCard } from "@/components/patient/PatientConditionsCard"
// import { PatientTreatmentsCard } from "@/components/patient/PatientTreatmentsCard" // Remove old card import
// import { PatientTreatmentsSimpleList } from "@/components/patient/PatientTreatmentsSimpleList" // Corrected import path/name
// Removed PatientConditionsCard and PatientTreatmentsCard imports
import { TrackingInbox } from "@/components/patient/TrackingInbox"
import { logger } from "@/lib/logger"

export default async function PatientDashboard() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch conditions first 
  const conditions = await getPatientConditionsAction(user.id)

  // If no conditions, redirect to onboarding
  if (conditions.length === 0) {
    logger.info("User has no conditions, redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Fetch other data 
  // const patientRatings = await getRatingsByPatientAction(user.id) // Keep if needed later, unused for now
  const initialNotifications = await getPendingReminderNotificationsAction(user.id) // Renamed variable
  // Removed fetching allPatientTreatments as it's not displayed directly anymore

  // REMOVE conditionsWithTreatments mapping logic
  // const conditionsWithTreatments = await Promise.all(...).then(...);

  return (
    <div className="container space-y-8 py-8">
      {/* Conditionally render Tracking Inbox */}
      {initialNotifications && initialNotifications.length > 0 && ( // Use renamed variable
          <TrackingInbox userId={user.id} initialNotifications={initialNotifications} /> // Pass prop with new name
      )}

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4"> {/* Simplified header, removed button */}
          <div>
            <CardTitle>Your Conditions & Treatments</CardTitle>
            <CardDescription>View and manage your health data</CardDescription> {/* Simplified desc */}
          </div>
        </CardHeader>
        <CardContent> {/* New content with large buttons */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"> 
              <Link href="/patient/conditions">
                  <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2"> 
                      <HeartPulse className="h-6 w-6" />
                      <span>Conditions</span>
                  </Button>
              </Link>
              <Link href="/patient/treatments">
                  <Button variant="outline" size="lg" className="w-full h-24 flex flex-col justify-center items-center gap-2"> 
                      <Pill className="h-6 w-6" />
                      <span>Treatments</span>
                  </Button>
              </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

