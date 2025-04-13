import type { Metadata } from "next"
import { getServerUser } from "@/lib/server-auth"
import { createServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"
import { createUnifiedLogger } from "@/lib/logger"

// Import Dashboard Components
import { DashboardHeader } from "./components/dashboard-header"
import { DashboardStats } from "./components/dashboard-stats"
import { ActiveTrials } from "./components/active-trials"
import { PatientManagement } from "./components/patient-management"
import { PendingActions } from "./components/pending-actions"

export const metadata: Metadata = {
  title: "Provider Dashboard | FDA v2",
  description: "Manage your clinical trials, patients, and interventions",
}

// Define types from database schema
type Trial = Database["public"]["Tables"]["trials"]["Row"]
type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
type TrialAction = Database["public"]["Tables"]["trial_actions"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ActionType = Database["public"]["Tables"]["action_types"]["Row"]

// Extended types used in data fetching
type FetchedTrial = Trial & {
  trial_enrollments: TrialEnrollment[];
  trial_actions: (TrialAction & { action_type: ActionType })[];
  research_partner_profile: Profile | null;
}

type FetchedPatient = Database["public"]["Tables"]["patients"]["Row"] & {
  profile: Profile | null;
  conditions: { condition: { id: string; name: { name: string | null } | null } | null }[];
}

type FetchedEnrollment = TrialEnrollment & {
  patient: (Database["public"]["Tables"]["patients"]["Row"] & { profile: Profile | null });
  trial: Trial;
  trial_actions: (TrialAction & { action_type: ActionType })[];
}

// --- Types for Component Props (Transform fetched data into these) ---

type ActiveTrialForUI = {
  id: string
  name: string
  research_partner: string
  enrolledPatients: number
  targetPatients: number
  progress: number
  nextVisit?: string // Placeholder - needs logic to determine
  pendingActions: number
}

type EligiblePatientForUI = Profile & Database["public"]["Tables"]["patients"]["Row"] & {
  eligibleTrials: { id: string; name: string }[]
  lastVisit: string // Placeholder - needs data source
  status: string // Placeholder - needs data source
  condition: string
  avatar_url: string | null
}

type EnrolledPatientForUI = Profile & Database["public"]["Tables"]["patients"]["Row"] & {
  trial: string
  enrollmentDate: string
  nextVisit: string // Placeholder - needs logic to determine
  condition: string
  pendingActions: { type: string; name: string; due: string }[]
}

type PendingActionForUI = {
  id: number // Needs a unique ID - maybe trial_action id?
  patient: string
  action: string
  trial: string
  due: string
  type: string // Needs mapping (e.g., action_type.category or name)
}

export default async function ProviderDashboard() {
  const logger = createUnifiedLogger("ProviderDashboard")
  const supabase = await createServerClient()
  const user = await getServerUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch provider profile
  const { data: providerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>() // Specify type

  if (profileError) {
    logger.error("Error fetching provider profile", { error: profileError })
    return <div>Error loading provider profile.</div>
  }
  if (!providerProfile) {
    return <div>Provider profile not found.</div>
  }

  // Fetch active trials
  const { data: fetchedTrials, error: trialsError } = await supabase
    .from("trials")
    .select(`
      *,
      trial_enrollments!inner (*),
      trial_actions!inner ( *,
        action_type:action_types!inner (*) ),
      research_partner_profile:profiles!trials_research_partner_id_fkey (*)
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .returns<FetchedTrial[]>() // Specify return type

  if (trialsError) {
    logger.error("Error fetching active trials", { error: trialsError })
    return <div>Error loading trial data.</div>
  }

  // Fetch patients 
  const { data: fetchedPatients, error: patientsError } = await supabase
    .from("patients")
    .select(`
      *,
      profile:profiles!patients_id_fkey (*),
      conditions:patient_conditions!inner ( condition:conditions!inner ( *,
          name:global_variables!conditions_id_fkey ( name ) ) )
    `)
    .is("deleted_at", null)
    .returns<FetchedPatient[]>() // Specify return type

  if (patientsError) {
    logger.error("Error fetching patients", { error: patientsError })
    return <div>Error loading patient data.</div>
  }

  // Fetch enrollments for this provider
  const { data: fetchedEnrollments, error: enrollmentsError } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      patient:patients!inner ( *,
        profile:profiles!patients_id_fkey (*) ),
      trial:trials!inner (*),
      trial_actions!inner ( *,
        action_type:action_types!inner (*) )
    `)
    .eq("provider_id", providerProfile.id)
    .is("deleted_at", null)
    .returns<FetchedEnrollment[]>() // Specify return type

  if (enrollmentsError) {
    logger.error("Error fetching enrollments", { error: enrollmentsError })
    return <div>Error loading enrollment data.</div>
  }

  // --- Transform data for components ---
  
  const activeTrialsForUI: ActiveTrialForUI[] = (fetchedTrials || []).map((trial) => ({
    id: trial.id,
    name: trial.title,
    research_partner: trial.research_partner_profile?.first_name ? `${trial.research_partner_profile.first_name} ${trial.research_partner_profile.last_name}` : 'Unknown Sponsor',
    enrolledPatients: trial.trial_enrollments?.length || 0,
    targetPatients: trial.enrollment_target || 0,
    progress: trial.enrollment_target ? ((trial.trial_enrollments?.length || 0) / trial.enrollment_target) * 100 : 0,
    pendingActions: trial.trial_actions?.filter(a => a.status === 'pending').length || 0,
    // nextVisit: Needs calculation/data source
  }));

  const eligiblePatientsForUI: EligiblePatientForUI[] = (fetchedPatients || []).map((patient) => {
    const profile = patient.profile; // Get the profile object (could be null)

    return {
      // --- Fields from patients["Row"] ---
      id: patient.id, // Use patient ID as primary
      allergies: patient.allergies ?? null,
      blood_type: patient.blood_type ?? null,
      date_of_birth: patient.date_of_birth ?? null,
      gender: patient.gender ?? null,
      height: patient.height ?? null,
      medications: patient.medications ?? null,
      weight: patient.weight ?? null,
      // --- Fields from Profile --- (check if profile exists before accessing)
      email: profile?.email ?? '', // Profile requires string
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      user_type: profile?.user_type ?? null,
      avatar_url: profile?.avatar_url ?? null,
      timezone: profile?.timezone ?? null, // Add timezone from profile
      // --- Overlapping fields (use patient's creation/update/deletion time) ---
      created_at: patient.created_at ?? null, // Use patient's created_at
      updated_at: patient.updated_at ?? null, // Use patient's updated_at
      deleted_at: patient.deleted_at ?? null, // Use patient's deleted_at
      // --- Fields specific to EligiblePatientForUI ---
      condition: patient.conditions[0]?.condition?.name?.name || 'N/A',
      eligibleTrials: (fetchedTrials || [])
        .filter(t => patient.conditions.some(c => c.condition?.id === t.condition_id))
        .map(t => ({ id: t.id, name: t.title })),
      lastVisit: 'N/A', // Placeholder
      status: 'Eligible' // Placeholder
    };
  });
  
  const enrolledPatientsForUI: EnrolledPatientForUI[] = (fetchedEnrollments || []).map((enrollment) => {
    const patient = enrollment.patient; // Get the patient object (should exist based on query)
    const profile = patient?.profile; // Get the profile object (could be null)

    return {
      // --- Fields from patients["Row"] ---
      id: patient.id, // Use patient ID as primary
      allergies: patient.allergies ?? null,
      blood_type: patient.blood_type ?? null,
      date_of_birth: patient.date_of_birth ?? null,
      gender: patient.gender ?? null,
      height: patient.height ?? null,
      medications: patient.medications ?? null,
      weight: patient.weight ?? null,
      // --- Fields from Profile ---
      email: profile?.email ?? '',
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      user_type: profile?.user_type ?? null,
      avatar_url: profile?.avatar_url ?? null,
      timezone: profile?.timezone ?? null, // Add timezone from profile
      // --- Overlapping fields ---
      created_at: patient.created_at ?? null,
      updated_at: patient.updated_at ?? null,
      deleted_at: patient.deleted_at ?? null,
      // --- Fields specific to EnrolledPatientForUI ---
      trial: enrollment.trial.title,
      enrollmentDate: new Date(enrollment.enrollment_date || '').toLocaleDateString(),
      // Find condition from the previously mapped eligiblePatientsForUI
      condition: eligiblePatientsForUI.find(p => p.id === enrollment.patient_id)?.condition || 'N/A', 
      pendingActions: enrollment.trial_actions
        .filter(action => action.status === 'pending')
        .map(action => ({
          type: action.action_type.category, // Use category as type
          name: action.title,
          due: new Date(action.due_date).toLocaleDateString(),
        })),
      nextVisit: 'N/A' // Placeholder
    };
  });

  const allPendingActionsForUI: PendingActionForUI[] = (fetchedEnrollments || []).flatMap(enrollment => 
     enrollment.trial_actions
       .filter(action => action.status === 'pending')
       .map(action => ({
         id: parseInt(action.id.replace(/-/g, ''), 16) % 1000000, // Attempt to create a numeric ID from UUID for key prop
         patient: `${enrollment.patient.profile?.first_name} ${enrollment.patient.profile?.last_name}`,
         action: action.title,
         trial: enrollment.trial.title,
         due: new Date(action.due_date).toLocaleDateString(),
         type: action.action_type.category || 'other' // Map to type needed by component
       }))
  );

  // --- Calculate Stats ---
  const totalEnrolled = enrolledPatientsForUI.length;
  const totalEligible = eligiblePatientsForUI.length;
  const totalPendingActions = allPendingActionsForUI.length;
  // TODO: Calculate pendingActionsDueSoon, upcomingVisits, upcomingVisitsThisWeek, upcomingVisitsNextWeek
  const pendingActionsDueSoon = 0; // Placeholder
  const upcomingVisits = 0; // Placeholder
  const upcomingVisitsThisWeek = 0; // Placeholder
  const upcomingVisitsNextWeek = 0; // Placeholder

  // --- Render Page ---
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader 
        title="Provider Dashboard"
        description={`Welcome back, ${providerProfile.first_name || 'Provider'}. Manage your trials and patients.`}
      />
      <DashboardStats 
        activeTrials={activeTrialsForUI.length}
        enrolledPatients={totalEnrolled}
        eligiblePatients={totalEligible}
        pendingActions={totalPendingActions}
        pendingActionsDueSoon={pendingActionsDueSoon}
        upcomingVisits={upcomingVisits}
        upcomingVisitsThisWeek={upcomingVisitsThisWeek}
        upcomingVisitsNextWeek={upcomingVisitsNextWeek}
      />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <ActiveTrials trials={activeTrialsForUI} className="xl:col-span-2" />
        <PendingActions actions={allPendingActionsForUI.slice(0, 5)} totalActions={totalPendingActions} /> 
      </div>
      <PatientManagement 
        eligiblePatients={eligiblePatientsForUI} 
        enrolledPatients={enrolledPatientsForUI} 
      />
    </div>
  )
}
