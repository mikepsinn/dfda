'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music } from "lucide-react"
import type { Database } from "@/lib/database.types"

import { AddConditionDialog } from "./add-condition-dialog"
import { AddTreatmentDialog } from "./add-treatment-dialog"
import { ConditionsList } from "./conditions-list"
import { TreatmentsList } from "./treatments-list"
import { TreatmentSearch } from "./treatment-search"

// Define PatientCondition type alias
type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"];

interface TreatmentsClientProps {
  userId: string;
  initialConditions: PatientCondition[];
  conditionsError: Error | null; // Pass potential errors
}

export function TreatmentsClient({ 
  userId, 
  initialConditions,
  conditionsError
}: TreatmentsClientProps) {
  // Client-side state for selected treatment
  const [selectedTreatment, setSelectedTreatment] = useState<{ id: string; name: string } | null>(null)
  const conditions = initialConditions // Use the prop

  const handleSelectTreatment = (treatment: { id: string; name: string }) => {
    setSelectedTreatment(treatment)
    // TODO: Do something with the selected treatment, e.g., show details
    console.log("Selected treatment:", treatment) // Example action
  }

  // Handle condition fetching errors
  if (conditionsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load your conditions. Please try refreshing the page.</p>
          <p className="text-sm text-muted-foreground mt-2">{conditionsError.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
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
                  <AddConditionDialog userId={userId} />
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
                userId={userId}
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
            <TreatmentSearch 
              onSelect={handleSelectTreatment}
              selected={selectedTreatment}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 