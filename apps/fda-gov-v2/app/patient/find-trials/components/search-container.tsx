"use client"

import { useState } from "react"
import { ConditionSearch } from "@/components/ConditionSearch"
import { TreatmentResults } from "./treatment-results"

interface SearchContainerProps {
  initialConditions: { id: string; name: string }[]
}

export function SearchContainer({ initialConditions }: SearchContainerProps) {
  const [selectedCondition, setSelectedCondition] = useState("")

  // Handle condition selection
  const handleConditionSelect = (condition: string) => {
    setSelectedCondition(condition)
  }

  return (
    <div>
      <ConditionSearch
        onConditionSelect={handleConditionSelect}
        initialSearchTerm={selectedCondition}
        initialConditions={initialConditions}
      />

      {selectedCondition && <TreatmentResults condition={selectedCondition} onClear={() => setSelectedCondition("")} />}
    </div>
  )
}

