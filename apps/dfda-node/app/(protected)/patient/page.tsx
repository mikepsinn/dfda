import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import { getRatingsByPatientAction } from "@/app/actions/treatment-ratings"
import { getTreatmentsForConditionAction } from "@/app/actions/treatments"
// import { TreatmentCard } from "@/components/treatment-card" // Commented out - Component path/existence uncertain
// import { PatientConditionsCard } from "@/components/patient-conditions-card" // Commented out - Component not found
// import { PatientTreatmentsCard } from "@/components/patient-treatments-card" // Commented out - Component not found

export default async function PatientDashboard() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch conditions and treatments
  const conditions = await getPatientConditionsAction(user.id)
  const patientRatings = await getRatingsByPatientAction(user.id)

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
        condition_name: condition.condition_name || "Unknown Condition",
        treatments: treatments.map(t => ({
          id: t.id,
          effectiveness_out_of_ten: effectivenessMap[t.id] || 0,
          treatment: {
            global_variables: {
              name: t.name,
              description: t.description || ""
            }
          }
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
          {/* Commenting out usage of missing components */}
          {/* <CardContent>
            {conditions.length > 0 ? (
              <div className="space-y-8">
                <PatientConditionsCard conditions={conditions} />
                <PatientTreatmentsCard conditions={conditionsWithTreatments} />
              </div>
            ) : (
               <div className="text-center py-6 text-muted-foreground">
                 <p>No conditions added yet.</p>
                 <Link href="/patient/treatments" className="text-primary hover:underline">
                   Add your first condition
                 </Link>
               </div>
            )}
          </CardContent> */}
          {conditions.length > 0 ? (
            <div className="space-y-4">
              {conditionsWithTreatments.map((condition) => (
                <div key={condition.id} className="border-b pb-4 last:border-0">
                  <h3 className="font-medium">{condition.condition_name}</h3>
                  {condition.treatments && condition.treatments.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {condition.treatments.map((treatment) => (
                        <div key={treatment.id} className="text-sm text-muted-foreground">
                          {treatment.treatment.global_variables.name} - Effectiveness: {treatment.effectiveness_out_of_ten ?? "Not Rated"}/10
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">No treatments added yet</p>
                  )}
                </div>
              ))}
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

