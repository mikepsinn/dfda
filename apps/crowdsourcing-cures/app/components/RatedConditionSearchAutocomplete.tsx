'use client'

import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import {searchRatedConditions} from "@/app/dfdaActions";

interface ConditionSearchAutocompleteProps {
  onConditionSelect: (condition: string) => void
  placeholder?: string
  defaultValue?: string
}

export default function RatedConditionSearchAutocomplete({
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
  }, [])

  useEffect(() => {
    if (condition.length > 0 && showDropdown) {
      console.log('Searching for conditions:', condition)
      searchRatedConditions(condition).then(results => {
        console.log('Search results:', results)
        setSuggestions(results.map(result => result.name))
      })
    } else {
      setSuggestions([])
    }
  }, [condition, showDropdown])

  const handleSuggestionClick = (suggestion: string) => {
    console.log('handleSuggestionClick called with:', suggestion)
    setCondition(suggestion)
    setSuggestions([])
    setShowDropdown(false)
    onConditionSelect(suggestion)
  }

  const handleClear = () => {
    console.log('handleClear called')
    setCondition("")
    setShowDropdown(false)
    onConditionSelect("")
  }

  return (
    <div className="relative z-[100]">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value)
            setShowDropdown(true)
          }}
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
        <ul className="absolute z-[100] w-full mt-2 neobrutalist-container !p-0 max-h-60 overflow-auto">
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