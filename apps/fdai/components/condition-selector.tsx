"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

type ConditionSelectorProps = {
  onSelect: (conditions: string[]) => void
}

export function ConditionSelector({ onSelect }: ConditionSelectorProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const conditions = [
    "Diabetes",
    "Hypertension",
    "Arthritis",
    "Depression/Anxiety",
    "Fatigue",
    "IBS/Digestive Issues",
    "Migraines",
    "Autoimmune Condition",
  ]

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition))
    } else {
      setSelectedConditions([...selectedConditions, condition])
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Select your health conditions:</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {conditions.map((condition) => (
          <Button
            key={condition}
            variant={selectedConditions.includes(condition) ? "default" : "outline"}
            className="justify-start"
            onClick={() => toggleCondition(condition)}
          >
            {selectedConditions.includes(condition) && <Check className="mr-2 h-4 w-4" />}
            {condition}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => onSelect(selectedConditions)}
        disabled={selectedConditions.length === 0}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  )
}
