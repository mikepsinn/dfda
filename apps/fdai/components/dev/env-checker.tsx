"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EnvChecker() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkEnv() {
      try {
        // Use POST instead of GET to avoid caching issues
        const res = await fetch("/api/dev/check-env", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variables: [
              "OPENAI_API_KEY",
              "GOOGLE_API_KEY",
              "DEEPSEEK_API_KEY",
              "NEXT_PUBLIC_SUPABASE_URL",
              "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            ],
          }),
        })

        // Check if response is OK before trying to parse JSON
        if (!res.ok) {
          const text = await res.text()
          console.error("API response error:", text)
          throw new Error(`API returned ${res.status}: ${res.statusText}`)
        }

        const data = await res.json()

        // Check which variables are missing
        const missing: string[] = []
        const values = data.values || {}

        // Check if at least one AI provider key is present
        const hasAIProvider = values.OPENAI_API_KEY || values.GOOGLE_API_KEY || values.DEEPSEEK_API_KEY

        if (!hasAIProvider) {
          missing.push("AI Provider Key (OPENAI_API_KEY, GOOGLE_API_KEY, or DEEPSEEK_API_KEY)")
        }

        if (!values.NEXT_PUBLIC_SUPABASE_URL) {
          missing.push("NEXT_PUBLIC_SUPABASE_URL")
        }

        if (!values.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        }

        setMissingVars(missing)
      } catch (error) {
        console.error("Failed to check environment variables:", error)
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setIsChecking(false)
      }
    }

    if (process.env.NODE_ENV === "development") {
      checkEnv()
    } else {
      setIsChecking(false)
    }
  }, [])

  if (process.env.NODE_ENV !== "development" || isChecking) {
    return null
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Environment Check Error</AlertTitle>
          <AlertDescription>
            <p>Failed to check environment variables: {error}</p>
            <p className="mt-2 text-sm">
              This won't affect the application, but you won't see warnings about missing variables.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (missingVars.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Missing Environment Variables</AlertTitle>
        <AlertDescription>
          <p>The following environment variables are required but not set:</p>
          <ul className="list-disc pl-5 mt-2">
            {missingVars.map((variable) => (
              <li key={variable}>{variable}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">Add these to your .env.local file to enable all features.</p>
        </AlertDescription>
      </Alert>
    </div>
  )
}
