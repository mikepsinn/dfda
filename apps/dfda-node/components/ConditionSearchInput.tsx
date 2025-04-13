"use client"

import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchConditionsAction, getConditionsAction } from "@/app/actions/conditions"
import { logger } from "@/lib/logger"

// Define the type based on what the actions actually return
type ConditionSuggestion = {
  id: string
  name: string
  description: string | null
  emoji: string | null
}

interface ConditionSearchProps {
  onSelect: (condition: { id: string; name: string }) => void
  selected: { id: string; name: string } | null
}

export function ConditionSearchInput({
  onSelect,
  selected,
}: ConditionSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // Use the correct type for suggestions state
  const [suggestions, setSuggestions] = useState<ConditionSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load initial conditions
  useEffect(() => {
    const loadInitialConditions = async () => {
      try {
        setIsLoading(true)
        const results = await getConditionsAction()
        // The results should match ConditionSuggestion[] now
        setSuggestions(results)
      } catch (error) {
        logger.error("Error loading initial conditions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialConditions()
  }, [])

  // Handle search when typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm) return

      try {
        setIsLoading(true)
        const results = await searchConditionsAction(searchTerm)
        // The results should match ConditionSuggestion[] now
        setSuggestions(results)
      } catch (error) {
        logger.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm])

  // Set search term if selected is provided
  useEffect(() => {
    if (selected) {
      setSearchTerm(selected.name);
      logger.info("Selected condition set", { id: selected.id, name: selected.name });
    }
  }, [selected]);

  // Parameter type should match the state type
  const handleSelectCondition = (condition: ConditionSuggestion) => {
    onSelect({
      id: condition.id,
      name: condition.name
    })
    setSearchTerm("")
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Search conditions..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        aria-label="Search conditions"
      />

      {showSuggestions && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {isLoading ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Loading conditions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              No conditions found
            </div>
          ) : (
            suggestions.map((condition) => (
              <div
                key={condition.id}
                className="relative cursor-pointer select-none py-2 px-4 hover:bg-gray-100"
                onClick={() => handleSelectCondition(condition)}
              >
                <div className="flex items-center">
                  {condition.emoji && (
                    <span className="mr-2">{condition.emoji}</span>
                  )}
                  <span className="font-medium">{condition.name}</span>
                </div>
                {condition.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {condition.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
