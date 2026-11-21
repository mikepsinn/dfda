import type React from "react"
import { PatientNav } from "@/components/patient/patient-nav"
import { resolveInstance } from "@/lib/instance/resolve"

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // A company's site serves only the reminders of the patient app (lib/instance/routes.ts), so it gets no
  // patient menu: the menu's other pages are the network's own.
  if (await resolveInstance()) return <>{children}</>
  return (
    <div className="lg:flex lg:items-start">
      <PatientNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
