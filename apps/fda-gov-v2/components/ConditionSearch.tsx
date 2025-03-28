"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getConditionsAction, searchConditionsAction, type Condition } from "@/app/actions/conditions"

interface ConditionSearchProps {
  onConditionSelect: (condition: string) => void
  initialSearchTerm?: string
  initialConditions?: Condition[]
  availableConditions?: string[]
  placeholder?: string
}

export function ConditionSearch({
  onConditionSelect,
  initialSearchTerm = "",
  initialConditions = [],
  availableConditions,
  placeholder = "Search for a condition (e.g., diabetes, arthritis, depression)...",
}: ConditionSearchProps) {
  const [allConditions, setAllConditions] = useState<Condition[]>(initialConditions)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [suggestions, setSuggestions] = useState<Condition[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(initialConditions.length === 0)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialConditions.length === 0) {
      const fetchInitialConditions = async () => {
        setIsLoading(true)
        try {
          const conditions = await getConditionsAction()
          if (conditions) {
            setAllConditions(conditions)
          }
        } catch (error) {
          console.error("Failed to fetch conditions:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchInitialConditions()
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
      setSuggestions(allConditions.slice(0, 10))
      return
    }

    const filtered = allConditions.filter((condition) => condition.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setSuggestions(filtered)
  }, [searchTerm, allConditions])

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchTerm(query)

    if (query.length === 0) {
      setSuggestions(allConditions.slice(0, 10))
      setShowSuggestions(true)
      return
    }

    if (query.length < 2) {
      setShowSuggestions(true)
      setSuggestions([])
      return
    }

    setShowSuggestions(true)
    setIsLoading(true)
    try {
      const searchedConditions = await searchConditionsAction(query)
      if (searchedConditions) {
        setSuggestions(searchedConditions)
      }
    } catch (error) {
      console.error("Failed to search conditions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (condition: Condition) => {
    setSearchTerm(condition.name)
    onConditionSelect(condition.name)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className="pl-8"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
        />
      </div>

      {isLoading ? (
        <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
      ) : (
        showSuggestions && (
          <div ref={suggestionsRef} className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
            <ul className="py-1">
              {suggestions.map((condition) => (
                <li
                  key={condition.id}
                  className="cursor-pointer px-4 py-2 hover:bg-muted"
                  onClick={() => handleSuggestionClick(condition)}
                >
                  {condition.name}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}
