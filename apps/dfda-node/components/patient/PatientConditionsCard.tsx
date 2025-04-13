"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Database } from "@/lib/database.types"

// Get the specific type for a row from the patient_conditions_view
// Adjust if the action returns a slightly different structure
type PatientConditionViewRow = Database['public']['Views']['patient_conditions_view']['Row']

interface PatientConditionsCardProps {
  condition: PatientConditionViewRow
}

export function PatientConditionsCard({ condition }: PatientConditionsCardProps) {
  // Use patient_condition_id (condition.id) for the link
  const conditionDetailUrl = `/patient/conditions/${condition.id}`

  return (
    <Link href={conditionDetailUrl} className="block">
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
        <CardHeader>
          <CardTitle className="text-lg">{condition.condition_name || "Unknown Condition"}</CardTitle>
          {condition.description && (
            <CardDescription>{condition.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          {condition.status && (
             <p>Status: <span className="font-medium text-foreground capitalize">{condition.status}</span></p>
          )}
           {condition.severity && (
             <p>Severity: <span className="font-medium text-foreground capitalize">{condition.severity}</span></p>
           )}
           {condition.diagnosed_at && (
             <p>Diagnosed: <span className="font-medium text-foreground">{new Date(condition.diagnosed_at).toLocaleDateString()}</span></p>
           )}
           {/* Add more details if needed */}
        </CardContent>
      </Card>
    </Link>
  )
} 