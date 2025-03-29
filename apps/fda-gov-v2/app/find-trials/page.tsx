"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConditionSearch } from "@/components/ConditionSearch"
import type { Database } from "@/lib/database.types"

type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

export default function FindTrialsPage() {
  const router = useRouter()

  const handleConditionSelect = (condition: ConditionView) => {
    router.push(`/conditions/${condition.condition_id}/trials`)
  }

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Clinical Trials</h1>
        <p className="text-muted-foreground">
          Search for clinical trials by medical condition
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Conditions</CardTitle>
          <CardDescription>
            Search for a medical condition to find relevant clinical trials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConditionSearch onSelect={handleConditionSelect} />
        </CardContent>
      </Card>
    </div>
  )
} 