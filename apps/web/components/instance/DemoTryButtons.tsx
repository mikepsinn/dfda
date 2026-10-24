"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { instanceDemoLogin } from "@/lib/actions/instance-demo-login"
import type { InstanceDemoRole } from "@/lib/demo/instance"

const ROLES: { role: InstanceDemoRole; label: string }[] = [
  { role: "patient", label: "Try it as a patient" },
  { role: "clinician", label: "Try it as a clinician" },
]

/** The demo of a company's site (lib/demo/instance.ts): one button for each role. */
export function DemoTryButtons({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState<InstanceDemoRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function open(role: InstanceDemoRole) {
    setBusy(role)
    setError(null)
    const result = await instanceDemoLogin(role)
    if (result.success && result.redirectUrl) {
      // A full page load, so that the page reads the new session.
      window.location.href = result.redirectUrl
      return
    }
    setError(result.error ?? "Could not open the demo. Try again.")
    setBusy(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {ROLES.map(({ role, label }) => (
          <Button key={role} type="button" variant="outline" disabled={busy !== null} onClick={() => open(role)} className="gap-2">
            {busy === role && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
