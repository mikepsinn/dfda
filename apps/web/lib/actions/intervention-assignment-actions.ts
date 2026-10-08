'use server'

import { getServerUser } from '@/lib/server-auth'
import { getUserDb } from '@/lib/db/server'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { Tables } from "@/lib/database.types" // Import only Tables

// --- Fetch Patient Details ---
// This combines data from multiple tables needed for the assignment view
export type PatientAssignmentDetails =
  Tables<'patients'> &
  {
    profiles: Pick<Tables<'profiles'>, 'first_name' | 'last_name' | 'email'> | null;
    trial_enrollments: (Pick<Tables<'trial_enrollments'>, 'id' | 'enrollment_date' | 'status' | 'trial_id'> & {
      trials: Pick<Tables<'trials'>, 'id' | 'title' | 'description'> | null;
    })[]; // Assuming a patient could potentially be in multiple trials historically, filter for active?
    patient_conditions: (Pick<Tables<'patient_conditions'>, 'id' | 'diagnosed_at' | 'severity' | 'status' | 'notes'> & {
        conditions: Pick<Tables<'global_conditions'>, 'id'> | null; // Get condition name via global_variables?
    })[];
    // TODO: Add medical history, assessments, biomarkers - requires schema support or fetching from related tables
  }

export async function getPatientDetailsForAssignment(patientId: string): Promise<PatientAssignmentDetails | null> {
    // TODO: Add proper user role check (e.g., only providers can fetch this)
    const user = await getServerUser()
    if (!user) {
        logger.error('Auth error fetching patient details for assignment', { patientId })
        return null
    }

    try {
        const db = await getUserDb()
        const patient = await db.patients.findFirst({
            where: {
                id: patientId,
                trial_enrollments: { some: {} },
                // trial_enrollments: { some: { status: 'active' } }, // Filter for active enrollment?
            },
            include: {
                profiles: { select: { first_name: true, last_name: true, email: true } },
                trial_enrollments: {
                    select: {
                        id: true,
                        enrollment_date: true,
                        status: true,
                        trial_id: true,
                        trials: { select: { id: true, title: true, description: true } },
                    },
                },
                patient_conditions: {
                    select: {
                        id: true,
                        diagnosed_at: true,
                        severity: true,
                        status: true,
                        notes: true,
                        global_conditions: { select: { id: true } },
                    },
                },
            },
        })

        if (!patient) {
            return null
        }

        // TODO: Fetch condition names, potentially measurements for assessments/biomarkers separately if needed.

        const { patient_conditions, ...details } = patient
        return {
            ...details,
            patient_conditions: patient_conditions.map(({ global_conditions, ...condition }) => ({
                ...condition,
                conditions: global_conditions,
            })),
        }
    } catch (error) {
        logger.error('Error fetching patient assignment details', { patientId, userId: user.id, error })
        return null
    }
}

// --- Fetch Intervention Options ---
// Placeholder - depends heavily on how intervention arms are defined in your schema.
// Assuming treatments linked to a trial represent the arms for now.
export type InterventionOption = Pick<Tables<'global_treatments'>, 'id' | 'treatment_type'> & {
  // Add fields corresponding to the mock data (description, details, frequency, etc.)
  // These might come from treatments, global_variables, or a dedicated table.
  name: string; // Likely from global_variables
  description: string;
  details: string;
  frequency: string;
  route: string;
  duration: string;
  monitoring: string;
  sideEffects: { name: string; frequency: string; }[]; // Needs dedicated fetch/table
  contraindications: string[]; // Needs dedicated fetch/table
}

export async function getInterventionOptionsForTrial(trialId: string): Promise<InterventionOption[]> {
    // Basic auth check
    const user = await getServerUser()
    if (!user) {
        logger.error('Auth error fetching intervention options', { trialId })
        return []
    }

    // THIS IS A MAJOR PLACEHOLDER - Adapt query based on your actual schema structure for trial arms/interventions
    // Option 1: Fetch treatments directly linked to the trial?
    let trial
    try {
        const db = await getUserDb()
        trial = await db.trials.findUnique({
            where: { id: trialId },
            select: {
                global_treatments: {
                    select: { id: true, treatment_type: true, global_variables: { select: { name: true, description: true } } },
                },
            },
        })
    } catch (error) {
        logger.error('Error fetching intervention options for trial', { trialId, userId: user.id, error })
        return [] // Return empty array on error
    }

    // Option 2: Fetch protocol versions and get interventions from there?

    if (!trial) {
        logger.error('Error fetching intervention options for trial', { trialId, userId: user.id })
        return []
    }

    // TODO: Map the fetched data (treatments/protocol details) to the InterventionOption structure.
    // This will likely involve fetching more related data (side effects, contraindications, etc.)
    // For now, returning mock-like data based on treatment name.
    const treatment = trial.global_treatments
    const options: InterventionOption[] = [{
        id: treatment.id, // Use treatment ID
        treatment_type: treatment.treatment_type,
        name: treatment.global_variables.name || 'Intervention 1', // Use name from global_variables
        description: treatment.global_variables.description || `Description for ${treatment.global_variables.name}`,
        // Add dummy data for other fields until real data sources are identified/implemented
        details: "Details not yet implemented.",
        frequency: "Frequency TBD",
        route: "Route TBD",
        duration: "Duration TBD",
        monitoring: "Monitoring details TBD.",
        sideEffects: [],
        contraindications: [],
    }];

    // Manually add a Control option if applicable?
    options.push({
        id: 'control-arm-placeholder', // Use a placeholder ID
        treatment_type: 'control',
        name: "Standard of Care (Control)",
        description: "Continuation of current standard therapy.",
        details: "Maintain current standard therapy.",
        frequency: "Varies",
        route: "Varies",
        duration: "Ongoing",
        monitoring: "Standard clinical assessments.",
        sideEffects: [],
        contraindications: [],
    })

    return options;
}

// --- Assign Intervention Action ---

interface AssignInterventionPayload {
    enrollmentId: string;         // ID of the trial_enrollments record
    assignedInterventionId: string; // ID of the selected intervention (e.g., treatment ID or placeholder)
    notes?: string | null;         // Optional clinical notes
}

export async function assignIntervention(payload: AssignInterventionPayload): Promise<{ success: boolean; error?: string }> {
    const user = await getServerUser()
    if (!user) {
        logger.error('Auth error assigning intervention', { payload })
        return { success: false, error: 'Authentication required.' };
    }
    // TODO: Add role check - ensure user is authorized (e.g., a provider)

    if (!payload.enrollmentId || !payload.assignedInterventionId) {
        return { success: false, error: 'Enrollment ID and Intervention ID are required.' };
    }

    logger.info('Attempting to assign intervention', { userId: user.id, ...payload })

    // Update the trial_enrollments table. Add specific columns if they exist
    // e.g., 'assigned_treatment_id', 'assignment_notes', 'assignment_date'
    try {
        const db = await getUserDb()
        await db.trial_enrollments.updateMany({
            where: {
                id: payload.enrollmentId,
                // Add further checks? e.g., ensure status is appropriate for assignment?
                // status: 'enrolled',
            },
            data: {
                // Replace with your actual column names (these columns do not exist yet):
                // assigned_treatment_id: payload.assignedInterventionId,
                // assignment_notes: payload.notes,
                // assignment_date: new Date(),
                status: 'active_intervention' // Example: Update status? Or maybe just log assignment?
            },
        })
    } catch (error) {
        logger.error('Error updating trial enrollment with intervention assignment', { userId: user.id, ...payload, error })
        return { success: false, error: 'Database error: the intervention could not be assigned.' };
    }

    logger.info('Successfully assigned intervention', { userId: user.id, ...payload })
    // Revalidate the patient's page or related paths
    revalidatePath(`/provider/patients/${payload.enrollmentId}`); // Adjust path as needed
    // revalidatePath(`/provider/intervention-assignment/${payload.enrollmentId}`); // Also revalidate assignment form?

    return { success: true };
}
