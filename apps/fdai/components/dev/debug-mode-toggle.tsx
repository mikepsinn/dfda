"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function DebugModeToggle() {
  const [isDebugMode, setIsDebugMode] = useState(false)

  useEffect(() => {
    // Check if debug mode is enabled via environment variable
    const checkDebugMode = async () => {
      try {
        const response = await fetch("/api/dev/check-env", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variables: ["DEBUG_MODE"],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setIsDebugMode(data.values.DEBUG_MODE === "true")
        }
      } catch (error) {
        console.error("Failed to check debug mode:", error)
      }
    }

    checkDebugMode()
  }, [])

  return (
    <div className="flex items-center space-x-2 py-2">
      <Switch id="debug-mode" checked={isDebugMode} disabled={true} />
      <Label htmlFor="debug-mode" className="text-sm">
        Debug Mode {isDebugMode ? "Enabled" : "Disabled"}
        <p className="text-xs text-muted-foreground">
          {isDebugMode
            ? "Detailed error information will be shown"
            : "Set DEBUG_MODE=true in environment variables to enable"}
        </p>
      </Label>
    </div>
  )
}
