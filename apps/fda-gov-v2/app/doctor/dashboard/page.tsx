import type { Metadata } from "next"
// TODO: Uncomment when doctor user data is needed
// import { getServerUser } from "@/lib/supabase/auth-utils.server"
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "./components/dashboard-header"
import { DashboardStats } from "./components/dashboard-stats"
import { ActiveTrials } from "./components/active-trials"
import { PendingActions } from "./components/pending-actions"
import { PatientManagement } from "./components/patient-management"

export const metadata: Metadata = {
  title: "Doctor Dashboard | FDA v2",
  description: "Manage your clinical trials, patients, and interventions",
}

// Types for the data we'll fetch
// interface DoctorData {
//   id: string
//   name: string
//   email: string
//   specialty?: string
//   organization?: string
// }

interface Trial {
  id: number
  name: string
  sponsor: string
  enrolledPatients: number
  targetPatients: number
  progress: number
  nextVisit: string
  pendingActions: number
}

interface Patient {
  id: number
  name: string
  age: number
  condition: string
  eligibleTrials: { id: number; name: string }[]
  lastVisit: string
  status: string
}

interface EnrolledPatient {
  id: number
  name: string
  age: number
  condition: string
  trial: string
  enrollmentDate: string
  nextVisit: string
  pendingActions: { type: string; name: string; due: string }[]
}

interface PendingAction {
  id: number
  patient: string
  action: string
  trial: string
  due: string
  type: string
}

export default async function DoctorDashboard() {
  // TODO: Uncomment when doctor user data is needed
  // const user = await getServerUser()
  // TODO: Uncomment when supabase client is needed for data fetching
  // const supabase = createServerSupabaseClient()

  // TODO: Uncomment when doctor profile data is needed
  // Fetch doctor profile data
  // const { data: doctorProfile } = await supabase.from("users").select("*").eq("id", user?.id).single()

  // In a real app, we would fetch this data from the database
  // For now, we'll use mock data similar to what was in the client component

  // Mock data for active trials
  const activeTrials: Trial[] = [
    {
      id: 1,
      name: "Lecanemab for Early Alzheimer's Disease",
      sponsor: "Eisai/Biogen Collaborative Research",
      enrolledPatients: 8,
      targetPatients: 12,
      progress: 66,
      nextVisit: "May 15, 2025",
      pendingActions: 3,
    },
    {
      id: 2,
      name: "ABBV-951 for Advanced Parkinson's Disease",
      sponsor: "AbbVie Parkinson's Research Consortium",
      enrolledPatients: 5,
      targetPatients: 10,
      progress: 50,
      nextVisit: "May 18, 2025",
      pendingActions: 1,
    },
  ]

  // Mock data for eligible patients
  const eligiblePatients: Patient[] = [
    {
      id: 1,
      name: "Eleanor Thompson",
      age: 72,
      condition: "Early Alzheimer's Disease",
      eligibleTrials: [
        { id: 1, name: "Lecanemab for Early Alzheimer's Disease" },
        { id: 2, name: "Donanemab vs Standard of Care in Mild Alzheimer's Disease" },
      ],
      lastVisit: "April 28, 2025",
      status: "Eligible for enrollment",
    },
    {
      id: 2,
      name: "Robert Chen",
      age: 68,
      condition: "Advanced Parkinson's Disease",
      eligibleTrials: [{ id: 3, name: "ABBV-951 Subcutaneous Infusion for Advanced Parkinson's Disease" }],
      lastVisit: "May 2, 2025",
      status: "Pending consent",
    },
    {
      id: 3,
      name: "Sarah Williams",
      age: 42,
      condition: "Relapsing Multiple Sclerosis",
      eligibleTrials: [{ id: 5, name: "Tolebrutinib (BTK Inhibitor) for Relapsing Multiple Sclerosis" }],
      lastVisit: "April 30, 2025",
      status: "Eligible for enrollment",
    },
    {
      id: 4,
      name: "Michael Davis",
      age: 76,
      condition: "Mild Alzheimer's Disease",
      eligibleTrials: [{ id: 2, name: "Donanemab vs Standard of Care in Mild Alzheimer's Disease" }],
      lastVisit: "May 5, 2025",
      status: "Eligible for enrollment",
    },
  ]

  // Mock data for enrolled patients
  const enrolledPatients: EnrolledPatient[] = [
    {
      id: 5,
      name: "James Wilson",
      age: 74,
      condition: "Early Alzheimer's Disease",
      trial: "Lecanemab for Early Alzheimer's Disease",
      enrollmentDate: "March 15, 2025",
      nextVisit: "May 15, 2025",
      pendingActions: [
        { type: "form", name: "Cognitive Assessment", due: "May 15, 2025" },
        { type: "intervention", name: "Lecanemab Administration", due: "May 15, 2025" },
      ],
    },
    {
      id: 6,
      name: "Patricia Moore",
      age: 71,
      condition: "Early Alzheimer's Disease",
      trial: "Lecanemab for Early Alzheimer's Disease",
      enrollmentDate: "March 18, 2025",
      nextVisit: "May 18, 2025",
      pendingActions: [{ type: "form", name: "Quality of Life Assessment", due: "May 10, 2025" }],
    },
    {
      id: 7,
      name: "David Johnson",
      age: 65,
      condition: "Advanced Parkinson's Disease",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      enrollmentDate: "April 2, 2025",
      nextVisit: "May 14, 2025",
      pendingActions: [{ type: "intervention", name: "ABBV-951 Infusion Setup", due: "May 14, 2025" }],
    },
  ]

  // Mock data for pending actions
  const pendingActions: PendingAction[] = [
    {
      id: 1,
      patient: "James Wilson",
      action: "Complete Cognitive Assessment",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 15, 2025",
      type: "form",
    },
    {
      id: 2,
      patient: "James Wilson",
      action: "Administer Lecanemab Infusion",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 15, 2025",
      type: "intervention",
    },
    {
      id: 3,
      patient: "Patricia Moore",
      action: "Complete Quality of Life Assessment",
      trial: "Lecanemab for Early Alzheimer's Disease",
      due: "May 10, 2025",
      type: "form",
    },
    {
      id: 4,
      patient: "David Johnson",
      action: "Setup ABBV-951 Subcutaneous Infusion",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      due: "May 14, 2025",
      type: "intervention",
    },
    {
      id: 5,
      patient: "Robert Chen",
      action: "Obtain Informed Consent",
      trial: "ABBV-951 for Advanced Parkinson's Disease",
      due: "May 12, 2025",
      type: "consent",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="flex flex-col gap-8">
            <DashboardHeader
              title="Doctor Dashboard"
              description="Manage your clinical trials, patients, and interventions"
            />

            <DashboardStats
              activeTrials={activeTrials.length}
              enrolledPatients={enrolledPatients.length}
              eligiblePatients={eligiblePatients.length}
              pendingActions={pendingActions.length}
              pendingActionsDueSoon={
                pendingActions.filter((a) => new Date(a.due) < new Date(Date.now() + 86400000 * 3)).length
              }
              upcomingVisits={8}
              upcomingVisitsThisWeek={3}
              upcomingVisitsNextWeek={5}
            />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <ActiveTrials trials={activeTrials} className="lg:col-span-2" />

              <PendingActions actions={pendingActions.slice(0, 5)} totalActions={pendingActions.length} />
            </div>

            <PatientManagement eligiblePatients={eligiblePatients} enrolledPatients={enrolledPatients} />
          </div>
        </div>
      </main>
    </div>
  )
}
