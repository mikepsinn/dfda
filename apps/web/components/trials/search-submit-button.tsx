"use client"

import { useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

// The search loads a new page; the label says that it is running until the page arrives.
// Enter in a field also clicks this button, so the label changes for both.
export function SearchSubmitButton() {
  const [searching, setSearching] = useState(false)

  // A page that the Back button restores keeps its state, so the label is reset then.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setSearching(false)
    }
    window.addEventListener("pageshow", reset)
    return () => window.removeEventListener("pageshow", reset)
  }, [])

  return (
    <Button type="submit" size="lg" className="gap-2" onClick={() => setSearching(true)}>
      {searching ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <Search aria-hidden="true" className="h-4 w-4" />
      )}
      {searching ? "Searching…" : "Search trials"}
    </Button>
  )
}
