import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import Link from "next/link"
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
      <div className="flex flex-row items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Conditions</h1>
          <p className="text-muted-foreground">View and manage your health conditions.</p>
        </div>
        <AddConditionDialog userId={user.id} />
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
