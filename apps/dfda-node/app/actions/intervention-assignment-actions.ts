'use server'

import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Database, Tables } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

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
        conditions: Pick<Tables<'conditions'>, 'id'> | null; // Get condition name via global_variables?
    })[];
    // TODO: Add medical history, assessments, biomarkers - requires schema support or fetching from related tables
  }

export async function getPatientDetailsForAssignment(patientId: string): Promise<PatientAssignmentDetails | null> {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // TODO: Add proper user role check (e.g., only providers can fetch this)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        logger.error('Auth error fetching patient details for assignment', { patientId, error: authError })
        return null
    }

    const { data, error } = await supabase
        .from('patients')
        .select(`
            *,
            profiles ( first_name, last_name, email ),
            trial_enrollments!inner ( id, enrollment_date, status, trial_id, trials ( id, title, description ) ),
            patient_conditions ( id, diagnosed_at, severity, status, notes, conditions ( id ) )
        `)
        .eq('id', patientId)
        // .eq('trial_enrollments.status', 'active') // Filter for active enrollment?
        .maybeSingle()

    if (error) {
        logger.error('Error fetching patient assignment details', { patientId, userId: user.id, error })
        return null
    }
    
    // TODO: Fetch condition names, potentially measurements for assessments/biomarkers separately if needed.

    return data as PatientAssignmentDetails | null; 
}

// --- Fetch Intervention Options ---
// Placeholder - depends heavily on how intervention arms are defined in your schema.
// Assuming treatments linked to a trial represent the arms for now.
export type InterventionOption = Pick<Tables<'treatments'>, 'id' | 'treatment_type'> & {
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
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Basic auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        logger.error('Auth error fetching intervention options', { trialId, error: authError })
        return []
    }

    // THIS IS A MAJOR PLACEHOLDER - Adapt query based on your actual schema structure for trial arms/interventions
    // Option 1: Fetch treatments directly linked to the trial?
    const { data, error } = await supabase
        .from('trials') 
        .select(`
            treatments!inner (id, treatment_type, global_variables(name, description) ) 
        `)
        .eq('id', trialId)
        .single()
        
    // Option 2: Fetch protocol versions and get interventions from there?
    // const { data, error } = await supabase.from('protocol_versions').select('...').eq('trial_id', trialId).eq('status', 'active')

    if (error || !data || !data.treatments) {
        logger.error('Error fetching intervention options for trial', { trialId, userId: user.id, error })
        return [] // Return empty array on error
    }

    // TODO: Map the fetched data (treatments/protocol details) to the InterventionOption structure.
    // This will likely involve fetching more related data (side effects, contraindications, etc.)
    // For now, returning mock-like data based on treatment name.
    const options: InterventionOption[] = data.treatments.map((t: any, index: number) => ({
        id: t.id, // Use treatment ID
        treatment_type: t.treatment_type,
        name: t.global_variables?.name || `Intervention ${index + 1}`, // Use name from global_variables
        description: t.global_variables?.description || `Description for ${t.global_variables?.name}`, 
        // Add dummy data for other fields until real data sources are identified/implemented
        details: "Details not yet implemented.",
        frequency: "Frequency TBD",
        route: "Route TBD",
        duration: "Duration TBD",
        monitoring: "Monitoring details TBD.",
        sideEffects: [],
        contraindications: [],
    }));

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
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        logger.error('Auth error assigning intervention', { payload, error: authError })
        return { success: false, error: 'Authentication required.' };
    }
    // TODO: Add role check - ensure user is authorized (e.g., a provider)

    if (!payload.enrollmentId || !payload.assignedInterventionId) {
        return { success: false, error: 'Enrollment ID and Intervention ID are required.' };
    }

    logger.info('Attempting to assign intervention', { userId: user.id, ...payload })

    // Update the trial_enrollments table. Add specific columns if they exist
    // e.g., 'assigned_treatment_id', 'assignment_notes', 'assignment_date'
    const { error: updateError } = await supabase
        .from('trial_enrollments')
        .update({
            // Replace with your actual column names:
            // assigned_treatment_id: payload.assignedInterventionId, 
            assignment_notes: payload.notes, 
            assignment_date: new Date().toISOString(), 
            status: 'active_intervention' // Example: Update status? Or maybe just log assignment?
        })
        .eq('id', payload.enrollmentId)
        // Add further checks? e.g., ensure status is appropriate for assignment?
        // .eq('status', 'enrolled') 

    if (updateError) {
        logger.error('Error updating trial enrollment with intervention assignment', { userId: user.id, ...payload, error: updateError })
        return { success: false, error: `Database error: ${updateError.message}` };
    }

    logger.info('Successfully assigned intervention', { userId: user.id, ...payload })
    // Revalidate the patient's page or related paths
    revalidatePath(`/provider/patients/${payload.enrollmentId}`); // Adjust path as needed
    // revalidatePath(`/provider/intervention-assignment/${payload.enrollmentId}`); // Also revalidate assignment form?

    return { success: true };
} 