"use client"

import { useRouter } from "next/navigation"
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConditionSearch } from "@/components/ConditionSearch"

export function FindTrialsForm() {
  const router = useRouter()
  // We might not need this state anymore if navigation happens immediately
  // const [selectedConditions, setSelectedConditions] = useState<{ id: string; name: string }[]>([]) 

  const handleConditionSelect = (condition: { id: string; name: string }) => {
    if (condition) { // Simplified check
      // If state was needed: setSelectedConditions(prev => [...prev.filter(c => c.id !== condition.id), condition]);
      router.push(`/conditions/${condition.id}/trials`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Conditions</CardTitle>
        <CardDescription>
          Search for a medical condition to find relevant clinical trials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConditionSearch onSelect={handleConditionSelect} selected={null} />
      </CardContent>
    </Card>
  )
} 