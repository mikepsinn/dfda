"use client"

import { useEffect, useState } from "react"
import { LocateFixed, Loader2, MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { distanceOptions } from "@/lib/trials/trial-search"

type LocateState = "idle" | "locating" | "denied" | "failed"

const messages: Partial<Record<LocateState, string>> = {
  denied: "Location access is blocked. Type a city, state or postal code instead.",
  failed: "Your location could not be found. Type a city, state or postal code instead.",
}

// The location of the GET search form: place names, or the browser's location with a distance.
// The point is rounded to 2 decimals (about 1 km) before it goes into the form and the URL.
export function LocationField({
  defaultLocation,
  defaultNear,
  defaultDistance,
  maxLength,
}: {
  defaultLocation: string
  defaultNear: string
  defaultDistance: string
  maxLength: number
}) {
  const [near, setNear] = useState(defaultNear)
  const [state, setState] = useState<LocateState>("idle")
  // Only after hydration: the server cannot know whether the browser offers a location.
  const [canLocate, setCanLocate] = useState(false)
  useEffect(() => setCanLocate("geolocation" in navigator), [])

  const locate = () => {
    setState("locating")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setNear(`${coords.latitude.toFixed(2)},${coords.longitude.toFixed(2)}`)
        setState("idle")
      },
      error => setState(error.code === error.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    )
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="trial-location" className="block text-sm font-medium">Location</label>
        {canLocate && !near && (
          <button type="button" onClick={locate} disabled={state === "locating"}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-60">
            {state === "locating"
              ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              : <LocateFixed aria-hidden="true" className="h-4 w-4" />}
            {state === "locating" ? "Finding you…" : "Use my location"}
          </button>
        )}
      </div>
      {near ? (
        <>
          <input type="hidden" name="near" value={near} />
          <div className="flex gap-2">
            <p className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Near you</span>
              <button type="button" onClick={() => setNear("")} aria-label="Remove your location"
                className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </p>
            <select id="trial-location" name="distance" defaultValue={defaultDistance} aria-label="Distance from your location"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {distanceOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">Rounded to about 1 km. It is part of this search&apos;s link.</p>
        </>
      ) : (
        <>
          <Input id="trial-location" name="location" defaultValue={defaultLocation} placeholder="For example, Boston, Massachusetts"
            maxLength={maxLength} autoComplete="off" enterKeyHint="search" className="h-11" />
          <p role={messages[state] ? "status" : undefined} className="text-xs text-muted-foreground">
            {messages[state] ?? "City, state, country or postal code, separated by commas"}
          </p>
        </>
      )}
    </div>
  )
}
