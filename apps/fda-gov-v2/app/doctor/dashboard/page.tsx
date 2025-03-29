import type { Metadata } from "next"
import { getServerUser } from "@/lib/server-auth"
import { createServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"
import { createUnifiedLogger } from "@/lib/logger"

export const metadata: Metadata = {
  title: "Doctor Dashboard | FDA v2",
  description: "Manage your clinical trials, patients, and interventions",
}

// Define types from database schema
type Trial = Database["public"]["Tables"]["trials"]["Row"]
type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
type TrialAction = Database["public"]["Tables"]["trial_actions"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ActionType = Database["public"]["Tables"]["action_types"]["Row"]

// Extended types for UI components
type DashboardTrial = Trial & {
  enrolledPatients: number
  targetPatients: number
  progress: number
  pendingActions: number
  trial_enrollments?: TrialEnrollment[]
  trial_actions?: (TrialAction & {
    action_type: ActionType
  })[]
  sponsor_profile?: Profile
}

type EligiblePatientUI = {
  id: string
  name: string
  conditions: string[]
  eligibleTrials: { id: string; name: string }[]
  status: string
}

type EnrolledPatientUI = {
  id: string
  name: string
  trial: string
  enrollmentDate: string
  pendingActions: {
    type: string
    name: string
    due: string
  }[]
}

export default async function DoctorDashboard(): Promise<{
  trials: DashboardTrial[],
  eligiblePatients: EligiblePatientUI[],
  enrolledPatients: EnrolledPatientUI[]
}> {
  const logger = createUnifiedLogger("DoctorDashboard")
  const supabase = await createServerClient()
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
  }

  if (!doctorProfile) {
    throw new Error("Doctor profile not found")
  }

  // Fetch active trials with related data
  const { data: trials, error: trialsError } = await supabase
    .from("trials")
    .select(`
      *,
      trial_enrollments!inner (*),
      trial_actions!inner (
        *,
        action_type:action_types!inner (*)
      ),
      sponsor_profile:profiles!trials_sponsor_id_fkey (*)
    `)
    .eq("status", "active")
    .is("deleted_at", null)

  if (trialsError) {
    logger.error("Error fetching active trials", { error: trialsError })
  }

  const dashboardTrials: DashboardTrial[] = (trials || []).map((trial) => ({
    ...trial,
    enrolledPatients: trial.trial_enrollments?.length || 0,
    targetPatients: trial.enrollment_target || 0,
    progress: trial.enrollment_target ? (trial.trial_enrollments?.length || 0) / trial.enrollment_target * 100 : 0,
    pendingActions: trial.trial_actions?.filter(a => a.status === 'pending').length || 0,
  }))

  // Fetch patients with their conditions and enrollments
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select(`
      *,
      profile:profiles!patients_id_fkey (*),
      conditions:patient_conditions!inner (
        condition:conditions!inner (
          *,
          name:global_variables!conditions_id_fkey (
            name
          )
        )
      )
    `)
    .is("deleted_at", null)

  if (patientsError) {
    logger.error("Error fetching patients", { error: patientsError })
  }

  const eligiblePatients: EligiblePatientUI[] = (patients || []).map((patient) => ({
    id: patient.id,
    name: `${patient.profile.first_name} ${patient.profile.last_name}`,
    conditions: patient.conditions.map(c => c.condition.name.name),
    eligibleTrials: dashboardTrials
      .filter(t => patient.conditions.some(c => c.condition.id === t.condition_id))
      .map(t => ({ id: t.id, name: t.title })),
    status: "eligible"
  }))

  // Get enrolled patients
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      patient:patients!inner (
        *,
        profile:profiles!patients_id_fkey (*)
      ),
      trial:trials!inner (*),
      trial_actions!inner (
        *,
        action_type:action_types!inner (*)
      )
    `)
    .eq("doctor_id", doctorProfile.id)
    .is("deleted_at", null)

  if (enrollmentsError) {
    throw enrollmentsError
  }

  const enrolledPatients: EnrolledPatientUI[] = (enrollments || []).map((enrollment) => ({
    id: enrollment.patient.id,
    name: `${enrollment.patient.profile.first_name} ${enrollment.patient.profile.last_name}`,
    trial: enrollment.trial.title,
    enrollmentDate: new Date(enrollment.enrollment_date || '').toLocaleDateString(),
    pendingActions: enrollment.trial_actions
      .filter(action => action.status === 'pending')
      .map(action => ({
        type: action.action_type.name,
        name: action.title,
        due: new Date(action.due_date).toLocaleDateString()
      }))
  }))

  return {
    trials: dashboardTrials,
    eligiblePatients,
    enrolledPatients
  }
}
