import type { Metadata } from "next"
import { getServerUser } from "@/lib/server-auth"
import { DashboardHeader } from "./components/dashboard-header"
import { DashboardStats } from "./components/dashboard-stats"
import { ActiveTrials } from "./components/active-trials"
import { PendingActions } from "./components/pending-actions"
import { PatientManagement } from "./components/patient-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"
import { createUnifiedLogger } from "@/lib/logger"

export const metadata: Metadata = {
  title: "Doctor Dashboard | FDA v2",
  description: "Manage your clinical trials, patients, and interventions",
}

// Define types from database schema
type Trial = Database["public"]["Tables"]["trials"]["Row"]

// Extended types for UI components
type DashboardTrial = Trial & {
  name: string
  sponsor: string
  enrolledPatients: number
  targetPatients: number
  progress: number
  nextVisit?: string
  pendingActions: number
}

type EligiblePatientUI = Database["public"]["Tables"]["profiles"]["Row"] & Database["public"]["Tables"]["patients"]["Row"] & {
  eligibleTrials: { id: string; name: string }[]
  lastVisit: string
  status: string
  condition: string
}

type EnrolledPatientUI = Database["public"]["Tables"]["profiles"]["Row"] & Database["public"]["Tables"]["patients"]["Row"] & {
  trial: string
  enrollmentDate: string
  nextVisit: string
  condition: string
  pendingActions: { type: string; name: string; due: string }[]
}

export default async function DoctorDashboard() {
  const logger = createUnifiedLogger("DoctorDashboard")
  const supabase = await createClient()
  const user = await getServerUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch doctor profile
  const { data: doctorProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    logger.error("Error fetching doctor profile", { error: profileError })
    // Consider how to handle the error - redirect or show error message?
    // For now, just log and continue, might result in partial data display
  }

  if (!doctorProfile) {
    throw new Error("Doctor profile not found")
  }

  // Fetch active trials with related data
  const { data: trials, error: trialsError } = await supabase
    .from("trials")
    .select(`
      *,
      sponsor:profiles!trials_sponsor_id_fkey(*),
      trial_enrollments(
        id,
        patient_id,
        enrollment_date,
        next_visit_date
      ),
      trial_actions(
        id,
        status
      )
    `)
    .eq("status", "active")

  if (trialsError) {
    logger.error("Error fetching active trials", { error: trialsError })
    // trials will be null, handled by downstream checks
  }

  const activeTrials: DashboardTrial[] = trials?.map(trial => ({
    ...trial,
    name: trial.title || "Untitled Trial",
    sponsor: trial.sponsor?.first_name || "Unknown Sponsor",
    enrolledPatients: trial.current_enrollment || 0,
    targetPatients: trial.enrollment_target || 0,
    progress: trial.current_enrollment && trial.enrollment_target 
      ? (trial.current_enrollment / trial.enrollment_target) * 100 
      : 0,
    nextVisit: trial.trial_enrollments?.[0]?.next_visit_date,
    pendingActions: trial.trial_actions?.filter(a => a.status === "pending").length || 0
  })) || []

  // Fetch pending actions
  const { data: pendingActions, error: actionsError } = await supabase
    .from("trial_actions")
    .select(`
      *,
      trial:trials(*),
      enrollment:trial_enrollments(
        patient:profiles(*)
      )
    `)
    .eq("status", "pending")
    .order("due_date", { ascending: true })

  if (actionsError) {
    logger.error("Error fetching pending actions", { error: actionsError })
    // pendingActions will be null, handled by downstream checks
  }

  // Calculate dashboard stats
  const statsData = {
    activeTrials: activeTrials.length,
    enrolledPatients: activeTrials.reduce((sum, trial) => sum + (trial.current_enrollment || 0), 0),
    pendingActions: pendingActions?.length || 0,
    eligiblePatients: 0, // Use calculated eligible count
    pendingActionsDueSoon: pendingActions?.filter(a => { 
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return dueDate <= threeDaysFromNow;
    }).length || 0,
    upcomingVisits: 0, // Placeholder
    upcomingVisitsThisWeek: 0, // Placeholder
    upcomingVisitsNextWeek: 0 // Placeholder
  }

  // Fetch patients with their conditions and enrollments
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select(`
      *,
      profile:profiles!inner(*),
      conditions:patient_conditions(
        *,
        condition:conditions(*)
      ),
      enrollments:trial_enrollments(
        *,
        trial:trials(*),
        actions:trial_actions(*)
      )
    `)

  if (patientsError) {
    logger.error("Error fetching patients", { error: patientsError })
    // patients will be null, handled by downstream checks
  }

  // Split patients into eligible and enrolled, map to component types
  const eligiblePatientsUI: EligiblePatientUI[] = patients?.filter(p => !p.enrollments?.length).map(p => ({
    ...p,
    ...p.profile, // Flatten profile
    condition: p.conditions?.[0]?.condition?.name || "N/A",
    eligibleTrials: [], // Placeholder
    lastVisit: "N/A", // Placeholder
    status: "Eligible", // Placeholder

  })) || []

  const enrolledPatientsUI: EnrolledPatientUI[] = patients?.filter(p => p.enrollments?.length).map(p => ({
    ...p,
    ...p.profile, // Flatten profile
    trial: p.enrollments?.[0]?.trial?.title || "N/A",
    enrollmentDate: p.enrollments?.[0]?.enrollment_date ? new Date(p.enrollments[0].enrollment_date).toLocaleDateString() : "N/A",
    nextVisit: p.enrollments?.[0]?.next_visit_date ? new Date(p.enrollments[0].next_visit_date).toLocaleDateString() : "N/A",
    condition: p.conditions?.[0]?.condition?.name || "N/A",
    pendingActions: p.enrollments?.[0]?.actions?.filter(a => a.status === "pending").map(a => ({
      type: a.action_type_id || "Unknown", // Placeholder - needs mapping from action_types table
      name: a.description || "Action Required",
      due: a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A",
    })) || []
  })) || []

  return (
    <div className="container mx-auto py-6 space-y-8">
      <DashboardHeader title="Doctor Dashboard" description={`Welcome back, ${doctorProfile.first_name || 'Doctor'}`} />
      <DashboardStats 
        activeTrials={statsData.activeTrials}
        enrolledPatients={statsData.enrolledPatients}
        pendingActions={statsData.pendingActions}
        eligiblePatients={statsData.eligiblePatients} 
        pendingActionsDueSoon={statsData.pendingActionsDueSoon}
        upcomingVisits={statsData.upcomingVisits}
        upcomingVisitsThisWeek={statsData.upcomingVisitsThisWeek}
        upcomingVisitsNextWeek={statsData.upcomingVisitsNextWeek}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActiveTrials trials={activeTrials} className="md:col-span-2" /> 
        <div className="space-y-6">
          <PendingActions actions={pendingActions || []} totalActions={pendingActions?.length || 0} />
          <PatientManagement eligiblePatients={eligiblePatientsUI} enrolledPatients={enrolledPatientsUI} />
        </div>
      </div>
    </div>
  )
}
