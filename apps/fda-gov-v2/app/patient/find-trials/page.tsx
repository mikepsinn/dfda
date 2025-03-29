import { Metadata } from "next"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import { SearchContainer } from "./components/search-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConditionSearch } from "@/components/ConditionSearch"
import { getServerSession } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { Database } from "@/lib/database.types"

export const metadata: Metadata = {
  title: "Find Clinical Trials | FDA v2",
  description: "Search for clinical trials related to your conditions",
}

// Use the database view type directly
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

export default async function FindTrialsPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login?callbackUrl=/patient/find-trials')
  }

  // Fetch the user's conditions
  const userConditions = await getPatientConditionsAction()

  // No special transformation needed as we use the database view type directly
  const allConditions = userConditions

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Find Clinical Trials</h1>
        <p className="text-muted-foreground">
          Search for clinical trials based on your medical conditions
        </p>
      </div>

      {userConditions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Conditions Found</CardTitle>
            <CardDescription>
              You don't have any medical conditions associated with your profile yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              To search for relevant clinical trials, you need to add your medical conditions first.
              You can add them by:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Going to your <a href="/patient/conditions" className="text-primary hover:underline">conditions page</a></li>
              <li>Adding your diagnosed conditions</li>
              <li>Returning here to search for relevant trials</li>
            </ol>
            <p>
              Or you can search for conditions below to see relevant trials even if they're not yet added to your profile.
            </p>
            <div className="mt-4">
              <ConditionSearch 
                onSelect={() => {}} // We'll handle this in the component
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <SearchContainer initialConditions={allConditions} />
      )}
    </div>
  )
}
