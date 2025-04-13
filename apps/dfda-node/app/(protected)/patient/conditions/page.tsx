import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { getPatientConditionsAction } from "@/app/actions/patient-conditions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function PatientConditionsPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/login")
  }

  const conditions = await getPatientConditionsAction(user.id)

  return (
    <div className="container space-y-8 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Your Conditions</CardTitle>
            <CardDescription>View and manage your health conditions.</CardDescription>
          </div>
          {/* Link to a page where conditions can be added/managed */}
          <Link href="/patient/treatments"> {/* Adjust if a different page is used */} 
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Manage Conditions
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {conditions.length > 0 ? (
            <div className="space-y-4">
              {conditions.map((condition) => (
                <Link key={condition.id} href={`/patient/conditions/${condition.id}`} className="block">
                  <Card className="hover:bg-muted/50 cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{condition.condition_name || "Unknown Condition"}</CardTitle>
                      {condition.description && (
                        <CardDescription>{condition.description}</CardDescription>
                      )}
                    </CardHeader>
                    {/* Optional: Add more details like status, severity if needed */}
                    {/* <CardContent>
                        <p>Status: {condition.status}</p>
                        <p>Severity: {condition.severity}</p>
                    </CardContent> */}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>You haven't added any conditions yet.</p>
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
