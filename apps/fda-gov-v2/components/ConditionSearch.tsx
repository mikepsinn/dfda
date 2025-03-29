"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { searchConditionsAction } from "@/app/actions/conditions"
import type { Database } from "@/lib/database.types"

// Use the database view type directly
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]

interface ConditionSearchProps {
  onSelect: (condition: { id: string; name: string }) => void
  selected: { id: string; name: string } | null
}

export function ConditionSearch({
  onSelect,
  selected,
}: ConditionSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<ConditionView[]>([])
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
    // Only call onSelect if we have both required fields
    if (condition.condition_id && condition.condition_name) {
      onSelect({
        id: condition.condition_id,
        name: condition.condition_name
      })
      setSearchTerm("")
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="space-y-1">
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
                suggestion.condition_id && suggestion.condition_name ? (
                  <div
                    key={suggestion.condition_id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectCondition(suggestion)}
                  >
                    {suggestion.condition_name}
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selected && (
        <div className="p-2 bg-gray-100 rounded-md">
          <span>{selected.name}</span>
        </div>
      )}
    </div>
  )
}
