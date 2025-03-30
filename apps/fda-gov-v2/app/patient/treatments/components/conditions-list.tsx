"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PatientCondition } from "@/lib/database.types"

interface ConditionsListProps {
  conditions: PatientCondition[]
}

export function ConditionsList({ conditions }: ConditionsListProps) {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {conditions.map((condition) => (
          <Card
            key={condition.id}
            className={`cursor-pointer transition-colors ${
              selectedCondition === condition.id ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedCondition(condition.id)}
          >
            <CardHeader className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{condition.name}</CardTitle>
                  <CardDescription>
                    Diagnosed {formatDate(condition.diagnosed_at)}
                  </CardDescription>
                </div>
                <Badge variant={condition.status === 'active' ? 'default' : 'secondary'}>
                  {condition.status}
                </Badge>
              </div>
            </CardHeader>
            {condition.notes && (
              <CardContent className="pt-0 pb-4 px-4">
                <p className="text-sm text-muted-foreground">{condition.notes}</p>
              </CardContent>
            )}
          </Card>
        ))}
        {conditions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No conditions added yet. Click "Add Condition" to get started.
          </div>
        )}
      </div>
    </ScrollArea>
  )
} 