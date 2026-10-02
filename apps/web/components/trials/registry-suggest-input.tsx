"use client"

import { useEffect, useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { fetchRegistrySuggestions, type RegistrySuggestionDictionary } from "@/lib/trials/registry-suggestions"

// A text field of the GET search form, with name suggestions in a native datalist. The form works
// without them; the browser handles the keyboard and screen-reader behavior of the list.
export function RegistrySuggestInput({
  dictionary,
  id,
  name,
  defaultValue,
  placeholder,
  maxLength,
}: {
  dictionary: RegistrySuggestionDictionary
  id: string
  name: string
  defaultValue: string
  placeholder: string
  maxLength: number
}) {
  const listId = useId()
  const [value, setValue] = useState(defaultValue)
  // No request until the visitor types: a value from the URL needs no suggestions.
  const [edited, setEdited] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!edited) return
    const controller = new AbortController()
    // Wait for a pause in typing, and drop the answer to an earlier input.
    const timer = setTimeout(async () => {
      const names = await fetchRegistrySuggestions(dictionary, value, controller.signal)
      if (!controller.signal.aborted) setSuggestions(names)
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [dictionary, edited, value])

  return (
    <>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={event => {
          setValue(event.target.value)
          setEdited(true)
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        list={listId}
        autoComplete="off"
        enterKeyHint="search"
        className="h-11"
      />
      <datalist id={listId}>
        {suggestions
          .filter(suggestion => suggestion !== value)
          .map(suggestion => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
    </>
  )
}
