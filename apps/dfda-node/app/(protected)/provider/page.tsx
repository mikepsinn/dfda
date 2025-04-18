import type { Metadata } from "next"
import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"
import { createUnifiedLogger } from "@/lib/logger"
import { getUserProfile } from "@/lib/profile"
import { getProviderActiveTrialsAction, getProviderPatientsAction } from "@/lib/actions/trials"
import { getProviderEnrollmentsAction } from "@/lib/actions/trial-enrollments"

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

// Define types for UI components
type ActiveTrialForUI = {
  id: string
  name: string
  research_partner: string
  enrolledPatients: number
  targetPatients: number
  progress: number
  nextVisit?: string
  pendingActions: number
}

type EligiblePatientForUI = Database["public"]["Tables"]["profiles"]["Row"] & Database["public"]["Tables"]["patients"]["Row"] & {
  eligibleTrials: { id: string; name: string }[]
  lastVisit: string
  status: string
  condition: string
  avatar_url: string | null
}

type EnrolledPatientForUI = Database["public"]["Tables"]["profiles"]["Row"] & Database["public"]["Tables"]["patients"]["Row"] & {
  trial: string
  enrollmentDate: string
  nextVisit: string
  condition: string
  pendingActions: { type: string; name: string; due: string }[]
}

type PendingActionForUI = {
  id: number
  patient: string
  action: string
  trial: string
  due: string
  type: string
}

export default async function ProviderDashboard() {
  const logger = createUnifiedLogger("ProviderDashboard")
  const user = await getServerUser()
  
  if (!user) {
    redirect("/login")
  }

  // Fetch provider profile using helper
  const providerProfile = await getUserProfile(user);

  if (!providerProfile) {
    logger.error("Could not fetch provider profile.", { userId: user.id });
    return <div>Error loading provider profile. Ensure your role is set correctly.</div>
  }
  
  if (providerProfile.user_type !== 'provider') {
    logger.warn("User accessed provider dashboard but has wrong user_type.", { userId: user.id, userType: providerProfile.user_type });
    redirect("/select-role?error=access_denied");
  }

  try {
    // Fetch all required data using server actions
    const [fetchedTrials, fetchedPatients, fetchedEnrollments] = await Promise.all([
      getProviderActiveTrialsAction(),
      getProviderPatientsAction(),
      getProviderEnrollmentsAction(providerProfile.id)
    ]);

    // Transform data for components
    const activeTrialsForUI: ActiveTrialForUI[] = fetchedTrials.map((trial) => ({
      id: trial.id,
      name: trial.title,
      research_partner: trial.research_partner_profile?.first_name ? 
        `${trial.research_partner_profile.first_name} ${trial.research_partner_profile.last_name}` : 
        'Unknown Sponsor',
      enrolledPatients: trial.trial_enrollments?.length || 0,
      targetPatients: trial.enrollment_target || 0,
      progress: trial.enrollment_target ? 
        ((trial.trial_enrollments?.length || 0) / trial.enrollment_target) * 100 : 0,
      pendingActions: trial.trial_actions?.filter(a => a.status === 'pending').length || 0,
    }));

    const eligiblePatientsForUI: EligiblePatientForUI[] = fetchedPatients.map((patient) => {
      const profile = patient.profile;

      return {
        id: patient.id,
        allergies: patient.allergies,
        blood_type: patient.blood_type,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        height: patient.height,
        medications: patient.medications,
        weight: patient.weight,
        email: profile?.email ?? '',
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        user_type: profile?.user_type ?? null,
        avatar_url: profile?.avatar_url ?? null,
        timezone: profile?.timezone ?? null,
        created_at: patient.created_at,
        updated_at: patient.updated_at,
        deleted_at: patient.deleted_at,
        condition: patient.conditions[0]?.condition?.name?.name || 'N/A',
        eligibleTrials: fetchedTrials
          .filter(t => patient.conditions.some(c => c.condition?.id === t.condition_id))
          .map(t => ({ id: t.id, name: t.title })),
        lastVisit: 'N/A',
        status: 'Eligible'
      };
    });
    
    const enrolledPatientsForUI: EnrolledPatientForUI[] = fetchedEnrollments.map((enrollment) => {
      const patient = enrollment.patient;
      const profile = patient?.profile;

      return {
        id: patient.id,
        allergies: patient.allergies,
        blood_type: patient.blood_type,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        height: patient.height,
        medications: patient.medications,
        weight: patient.weight,
        email: profile?.email ?? '',
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        user_type: profile?.user_type ?? null,
        avatar_url: profile?.avatar_url ?? null,
        timezone: profile?.timezone ?? null,
        created_at: patient.created_at,
        updated_at: patient.updated_at,
        deleted_at: patient.deleted_at,
        trial: enrollment.trial.title,
        enrollmentDate: new Date(enrollment.enrollment_date || '').toLocaleDateString(),
        condition: eligiblePatientsForUI.find(p => p.id === enrollment.patient_id)?.condition || 'N/A',
        pendingActions: enrollment.trial_actions
          .filter(action => action.status === 'pending')
          .map(action => ({
            type: action.action_type.category,
            name: action.title,
            due: new Date(action.due_date).toLocaleDateString(),
          })),
        nextVisit: 'N/A'
      };
    });

    const allPendingActionsForUI: PendingActionForUI[] = fetchedEnrollments.flatMap(enrollment => 
      enrollment.trial_actions
        .filter(action => action.status === 'pending')
        .map(action => ({
          id: parseInt(action.id.replace(/-/g, ''), 16) % 1000000,
          patient: `${enrollment.patient.profile?.first_name} ${enrollment.patient.profile?.last_name}`,
          action: action.title,
          trial: enrollment.trial.title,
          due: new Date(action.due_date).toLocaleDateString(),
          type: action.action_type.category || 'other'
        }))
    );

    // Calculate Stats
    const totalEnrolled = enrolledPatientsForUI.length;
    const totalEligible = eligiblePatientsForUI.length;
    const totalPendingActions = allPendingActionsForUI.length;
    const pendingActionsDueSoon = 0;
    const upcomingVisits = 0;
    const upcomingVisitsThisWeek = 0;
    const upcomingVisitsNextWeek = 0;

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
  } catch (error) {
    logger.error("Error loading provider dashboard data:", error);
    return <div>Error loading dashboard data. Please try again later.</div>
  }
}
