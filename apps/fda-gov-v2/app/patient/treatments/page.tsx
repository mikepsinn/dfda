import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AddConditionDialog } from "./components/add-condition-dialog"
import { AddTreatmentDialog } from "./components/add-treatment-dialog"
import { ConditionsList } from "./components/conditions-list"
import { TreatmentsList } from "./components/treatments-list"
import { TreatmentSearch } from "./components/treatment-search"
import { Music } from "lucide-react"

export default async function TreatmentsPage() {
  const user = await getServerUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  // Fetch user's conditions with their treatments
  const { data: conditions } = await supabase
    .from("patient_conditions_view")
    .select(`
      *,
      treatments:patient_treatments(
        *,
        treatment:treatments(
          *,
          global_variables(name, description)
        )
      )
    `)
    .eq("patient_id", user.id)
    .is("deleted_at", null)

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treatments & Conditions</h1>
          <p className="text-muted-foreground">Manage your conditions and track treatment effectiveness</p>
        </div>
        <div className="flex gap-4">
          <AddConditionDialog userId={user.id} />
          <AddTreatmentDialog userId={user.id} conditions={conditions || []} />
        </div>
      </div>

      <Tabs defaultValue="conditions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conditions">My Conditions & Treatments</TabsTrigger>
          <TabsTrigger value="search">Search Treatments</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Active Conditions</CardTitle>
                <CardDescription>Your current health conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {conditions && conditions.length > 0 ? (
                  <ConditionsList conditions={conditions} />
                ) : (
                  <div className="text-center py-6">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No conditions added yet.</p>
                    <AddConditionDialog userId={user.id} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Treatments</CardTitle>
                <CardDescription>Treatments you're currently using</CardDescription>
              </CardHeader>
              <CardContent>
                <TreatmentsList 
                  conditions={conditions || []} 
                  userId={user.id}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Search</CardTitle>
              <CardDescription>
                Search for treatments and see their effectiveness ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreatmentSearch />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 