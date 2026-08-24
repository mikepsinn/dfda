import React, { useRef, useEffect } from "react"
import { Search, X } from "lucide-react"

const inputStyles =
  "w-full rounded-xl border-4 border-black bg-white px-12 py-4 text-lg font-bold text-black placeholder:text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"

const suggestionButtonStyles =
  "w-full border-b-4 border-black px-4 py-3 text-left font-bold text-black transition-colors hover:bg-yellow-200 last:border-none"

interface SearchInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus: () => void
  onClear: () => void
  onSuggestionClick: (suggestion: string) => void
  placeholder: string
  suggestions: string[]
}

export default function SearchInput({
  value,
  onChange,
  onFocus,
  onClear,
  onSuggestionClick,
  placeholder,
  suggestions,
}: SearchInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-grow">
      <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 transform text-black" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => {
          setShowSuggestions(true)
          onFocus()
        }}
        className={inputStyles}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onSuggestionClick(suggestion)
                setShowSuggestions(false)
              }}
              className={suggestionButtonStyles}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 