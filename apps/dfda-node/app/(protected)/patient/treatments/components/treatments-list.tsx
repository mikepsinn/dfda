"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react"
import type { Database } from "@/lib/database.types"
import { createLogger } from "@/lib/logger"

const logger = createLogger("treatments-list")

type PatientCondition = Database["public"]["Views"]["patient_conditions_view"]["Row"]

interface TreatmentsListProps {
  conditions: PatientCondition[]
  userId: string
}

export function TreatmentsList({ conditions, userId }: TreatmentsListProps) {
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null)

  // Log the userId for audit purposes
  logger.info("Rendering treatments list for user", { userId, conditionCount: conditions.length })

  const getEffectivenessColor = (rating: number) => {
    if (rating >= 7) return "text-green-600"
    if (rating <= 3) return "text-red-600"
    return "text-yellow-600"
  }

  const getEffectivenessIcon = (rating: number) => {
    if (rating >= 7) return <ThumbsUp className="h-4 w-4" />
    if (rating <= 3) return <ThumbsDown className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {conditions.map((condition) => (
          <div key={condition.id!}>
            <h3 className="font-medium mb-3">{condition.condition_name}</h3>
            <div className="space-y-3">
              <div className="text-center py-4 text-muted-foreground"> 
                Treatment display temporarily disabled. 
              </div>
            </div>
            <Separator className="my-4" />
          </div>
        ))}
        {conditions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No conditions added yet. Add a condition to start tracking treatments.
          </div>
        )}
      </div>
    </ScrollArea>
  )
} 