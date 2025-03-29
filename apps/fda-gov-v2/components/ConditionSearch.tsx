"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { searchConditionsAction } from "@/app/actions/conditions"
import type { Database } from "@/lib/database.types"

// Use the database view type directly
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

// Update the props interface to use the new type
interface ConditionSearchProps {
  onSelect: (condition: ConditionView) => void
  initialConditions?: ConditionView[]
}

export function ConditionSearch({
  onSelect,
  initialConditions = [],
}: ConditionSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<ConditionView[]>([])
  const [conditions, setConditions] = useState<ConditionView[]>(initialConditions)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const results = await searchConditionsAction(searchTerm)
        setSuggestions(results)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      }
    }

    fetchSuggestions()
  }, [searchTerm])

  const handleSelectCondition = (condition: ConditionView) => {
    onSelect(condition)
    setSearchTerm("")
    setSuggestions([])
    setShowSuggestions(false)
    setConditions([...conditions, condition])
  }

  return (
    <div className="w-full space-y-2">
      <div className="space-y-1">
        <Label htmlFor="condition-search">Search Conditions</Label>
        <div className="relative">
          <Input
            id="condition-search"
            placeholder="Type to search conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full max-h-60 mt-1 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.condition_id}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectCondition(suggestion)}
                >
                  {suggestion.condition_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {conditions.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Conditions</Label>
          <div className="space-y-1">
            {conditions.map((condition) => (
              <div
                key={condition.condition_id}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
              >
                <span>{condition.condition_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConditions(
                      conditions.filter(
                        (c) => c.condition_id !== condition.condition_id
                      )
                    )
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
