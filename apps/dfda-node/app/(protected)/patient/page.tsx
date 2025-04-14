import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import { getRatingsByPatientAction } from "@/app/actions/treatment-ratings"
import { getTreatmentsForConditionAction } from "@/app/actions/treatments"
// Import the new components
import { PatientConditionsCard } from "@/components/patient/PatientConditionsCard"
import { PatientTreatmentsCard } from "@/components/patient/PatientTreatmentsCard"
// Import the Tracking Inbox
import { TrackingInbox } from "@/components/patient/TrackingInbox"
// Import action to pre-fetch tasks for SSR
// import { getPendingReminderTasksAction } from "@/app/actions/reminder-schedules"
import { logger } from "@/lib/logger"

export default async function PatientDashboard() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch conditions first to check for onboarding status
  const conditions = await getPatientConditionsAction(user.id)

  // If no conditions, redirect to onboarding
  if (conditions.length === 0) {
    logger.info("User has no conditions, redirecting to onboarding", { userId: user.id });
    redirect("/patient/onboarding");
  }

  // Fetch other data only if conditions exist
  const patientRatings = await getRatingsByPatientAction(user.id)
  // const initialTasks = await getPendingReminderTasksAction(user.id)

  // Get treatment details for each condition
  const conditionsWithTreatments = await Promise.all(
    conditions.map(async (condition) => {
      if (!condition.condition_id) return null
      const treatments = await getTreatmentsForConditionAction(condition.condition_id)
      const effectivenessMap = patientRatings.reduce((acc, curr) => {
        if (curr.patient_treatment_id) {
          acc[curr.patient_treatment_id] = curr.effectiveness_out_of_ten || 0
        }
        return acc
      }, {} as Record<string, number>)

      return {
        id: condition.id || "",
        condition_id: condition.condition_id,
        condition_name: condition.condition_name || "Unknown Condition",
        treatments: treatments.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          effectiveness_out_of_ten: effectivenessMap[t.id] || 0,
        }))
      }
    })
  ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null))

  // Process ratings (Example - adjust based on actual needs)
  // const ratingsByTreatment = (fetchedRatings || []).reduce((acc, curr) => {
  //   acc[curr.treatment_id] = curr.effectiveness_out_of_ten || 0 // Error: treatment_id doesn't exist
  //   return acc;
  // }, {} as Record<string, number>); 

  return (
    <div className="container space-y-8 py-8">
      {/* Optional: Add a welcome message or summary card first */}

      {/* Tracking Inbox */}
      {/* <TrackingInbox userId={user.id} initialTasks={initialTasks} /> */}
      <TrackingInbox userId={user.id} /* initialTasks={initialTasks} */ /> {/* Temp remove prop */}

      <Card>
        <CardHeader>
          <CardTitle>{user.user_metadata?.name || "Patient"}'s Dashboard</CardTitle>
          <CardDescription>Manage your conditions and treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-2xl font-bold">{conditions.length}</p>
              <p className="text-sm text-muted-foreground">Active Conditions</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{patientRatings.length}</p>
              <p className="text-sm text-muted-foreground">Rated Treatments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Your Conditions & Treatments</CardTitle>
            <CardDescription>Track your health conditions and treatment effectiveness</CardDescription>
          </div>
          <Link href="/patient/treatments">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {conditions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Conditions</h3>
                {conditions.map((condition) => (
                  // Pass the full condition object from the action
                  <PatientConditionsCard key={condition.id} condition={condition} />
                ))}
              </div>

              {/* Right Column: Treatments (Grouped by Condition) */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Treatments & Effectiveness</h3>
                {conditionsWithTreatments.length > 0 ? (
                  conditionsWithTreatments.map((conditionGroup) => (
                    <div key={conditionGroup.id} className="space-y-4">
                      {/* Optional: Sub-header for the condition if showing treatments grouped */}
                      {/* <h4 className="font-medium text-md">{conditionGroup.condition_name}</h4> */} 
                      {conditionGroup.treatments && conditionGroup.treatments.length > 0 ? (
                        conditionGroup.treatments.map((treatment) => (
                          <PatientTreatmentsCard 
                            key={`${conditionGroup.id}-${treatment.id}`}
                            treatment={treatment} 
                            conditionId={conditionGroup.id} // Pass patient_condition_id
                            conditionName={conditionGroup.condition_name} // Pass condition name
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground pl-2">
                          No treatments logged for {conditionGroup.condition_name} yet.
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-muted-foreground">No treatments found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No conditions added yet.</p>
              <Link href="/patient/treatments" className="text-primary hover:underline">
                Add your first condition
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

