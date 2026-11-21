import type React from "react"
import { PatientNav } from "@/components/patient/patient-nav"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="lg:flex lg:items-start">
      <PatientNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
