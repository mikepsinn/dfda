"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function ConditionSelector({ onValueChange }: { onValueChange: (value: string[]) => void }) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    async function fetchConditions() {
      try {
        setIsLoading(true)
        setError(null)
        console.log("ConditionSelector: Fetching conditions from database")

        const { data, error } = await supabase.from("conditions").select("name").order("name")

        if (error) {
          console.error("Error fetching conditions:", error)
          setError("Failed to load conditions. Please try again.")
          return
        }

        if (data && data.length > 0) {
          const conditionNames = data.map((condition) => condition.name)
          console.log("ConditionSelector: Fetched conditions", {
            count: conditionNames.length,
            conditions: conditionNames,
          })

          if (isMounted.current) {
            setConditions(conditionNames)
          }
        } else {
          // Fallback to default conditions if none in database
          console.log("ConditionSelector: No conditions found in database, using defaults")

          if (isMounted.current) {
            setConditions([
              "Diabetes",
              "Hypertension",
              "Arthritis",
              "Depression/Anxiety",
              "Fatigue",
              "IBS/Digestive Issues",
              "Migraines",
              "Autoimmune Condition",
            ])
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching conditions:", err)

        if (isMounted.current) {
          setError("An unexpected error occurred. Please try again.")
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchConditions()
  }, [])

  const toggleCondition = (condition: string) => {
    try {
      const newSelectedConditions = selectedConditions.includes(condition)
        ? selectedConditions.filter((c) => c !== condition)
        : [...selectedConditions, condition]

      console.log("Toggled condition:", condition, "New selection:", newSelectedConditions)
      setSelectedConditions(newSelectedConditions)
    } catch (err) {
      console.error("Error toggling condition:", err)
      setError("Failed to update condition selection. Please try again.")
    }
  }

  const handleSubmit = () => {
    if (selectedConditions.length > 0) {
      try {
        console.log("Submitting selected conditions:", selectedConditions)
        onValueChange(selectedConditions)
      } catch (error) {
        console.error("Error in condition selection submission:", error)
        setError("Failed to process selected conditions. Please try again.")
      }
    } else {
      console.log("No conditions selected, not submitting")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 my-4">
        <p className="text-sm font-medium">Loading health conditions...</p>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 my-4">
        <p className="text-sm font-medium text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="w-full">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 my-4">
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
      <Button onClick={handleSubmit} disabled={selectedConditions.length === 0} className="w-full">
        Continue
      </Button>
    </div>
  )
}
