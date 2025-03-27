"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getConditions } from "@/lib/api/conditions"

interface ConditionSearchProps {
  onConditionSelect: (condition: string) => void
  initialSearchTerm?: string
  initialConditions?: { id: string; name: string }[]
}

export function ConditionSearch({
  onConditionSelect,
  initialSearchTerm = "",
  initialConditions = [],
}: ConditionSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [conditions, setConditions] = useState<{ id: string; name: string }[]>(initialConditions)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(initialConditions.length === 0)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialConditions.length === 0) {
      const fetchConditions = async () => {
        try {
          const data = await getConditions()
          setConditions(data)
        } catch (error) {
          console.error("Error fetching conditions:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchConditions()
    }
  }, [initialConditions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([])
      return
    }

    const filtered = conditions.filter((condition) => condition.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setSuggestions(filtered.slice(0, 10))
  }, [searchTerm, conditions])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (condition: string) => {
    setSearchTerm(condition)
    onConditionSelect(condition)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for a condition (e.g., diabetes, arthritis, depression)..."
          className="pl-8"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
        />
      </div>

      {isLoading && <div className="mt-2 text-sm text-muted-foreground">Loading conditions...</div>}

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
          <ul className="py-1">
            {suggestions.map((condition) => (
              <li
                key={condition.id}
                className="cursor-pointer px-4 py-2 hover:bg-muted"
                onClick={() => handleSuggestionClick(condition.name)}
              >
                {condition.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions && searchTerm && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background p-4 shadow-lg">
          <p className="text-sm text-muted-foreground">No conditions found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}

