'use client'

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { searchClinicalTrialConditions } from "@/lib/clinicaltables"
import { X } from "lucide-react"

interface ConditionSearchAutocompleteProps {
  onConditionSelect: (condition: string) => void
  placeholder?: string
  defaultValue?: string
}

export default function ClinicalTrialConditionSearchAutocomplete({
  onConditionSelect, 
  placeholder = "Enter medical condition",
  defaultValue = ""
}: ConditionSearchAutocompleteProps) {
  const [condition, setCondition] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (defaultValue) {
      onConditionSelect(defaultValue)
    }
  }, [defaultValue, onConditionSelect])

  useEffect(() => {
    if (condition.length > 0) {
      searchClinicalTrialConditions(condition).then(extractedSuggestions => {
        setSuggestions(extractedSuggestions)
        setShowDropdown(true)
      })
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [condition])

  const handleSuggestionClick = (suggestion: string) => {
    setCondition(suggestion)
    setShowDropdown(false)
    onConditionSelect(suggestion)
  }

  const handleClear = () => {
    setCondition("")
    setShowDropdown(false)
    onConditionSelect("")
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="neobrutalist-container !p-3 !pr-10 !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold 
            hover:!translate-x-1 hover:!translate-y-1 hover:!shadow-none focus-visible:ring-0 
            focus-visible:ring-offset-0"
        />
        {condition && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-2 neobrutalist-container !p-0 max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="px-4 py-3 hover:bg-[#FF3366] hover:text-white cursor-pointer font-bold 
                border-b-2 border-black last:border-b-0 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}