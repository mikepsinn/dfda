import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionsAction } from "@/lib/actions/patient-conditions"
import { AddConditionDialog } from "../treatments/components/add-condition-dialog"
import { ConditionCard } from "@/components/patient/ConditionCard"

export default async function PatientConditionsPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const conditions = await getPatientConditionsAction(user.id)

  return (
    <div className="container space-y-8 py-8">
      <div className="flex flex-col items-start space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 pb-2">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Your Conditions</h1>
          <p className="text-muted-foreground">View and manage your health conditions.</p>
        </div>
        <div className="w-full md:w-auto">
          <AddConditionDialog userId={user.id} />
        </div>
      </div>

      {conditions.length > 0 ? (
        <div className="space-y-4">
          {conditions.map((condition) => (
            <ConditionCard key={condition.id} condition={condition} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground space-y-2">
          <p>You haven't added any conditions yet.</p>
          <AddConditionDialog userId={user.id} />
        </div>
      )}
    </div>
  )
}
