"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { getServerUser } from "@/lib/server-auth"; // Use the correct auth helper

// Define the specific profile fields we need for the list
export type PatientProfileSummary = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "avatar_url"
>;

// Export core types for seeding
export type PatientInsert = Database['public']['Tables']['patients']['Insert'];
export type PatientUpdate = Database['public']['Tables']['patients']['Update'];

/**
 * Fetches a list of patient profiles associated with the currently logged-in provider
 * through trial enrollments.
 */
export async function getProviderPatientsAction(): Promise<PatientProfileSummary[]> {
  const supabase = await createClient();
  const user = await getServerUser(); // Fetch the current user

  // Ensure the user is logged in
  if (!user) {
    logger.error("Unauthorized attempt to fetch provider patients: No user found");
    return []; // Return empty array if no user session
  }

  // Fetch the user's profile to get the user_type
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_type")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
     logger.error("Error fetching provider profile or profile not found", {
        userId: user.id,
        error: profileError,
      });
    return []; // Return empty array if profile fetch fails
  }

  // Ensure the user is a provider
  if (profile.user_type !== 'provider') {
    logger.error("Unauthorized attempt to fetch provider patients: User is not a provider", {
      userId: user.id,
      userType: profile.user_type,
    });
    return []; // Return empty array for non-provider users
  }

  const providerId = user.id;
  logger.info("Fetching patients for provider:", { providerId });

  try {
    // Step 1: Find all unique patient IDs from trial enrollments managed by this provider.
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("trial_enrollments")
      .select("patient_id")
      .eq("provider_id", providerId);

    if (enrollmentsError) {
      logger.error("Error fetching trial enrollments for provider", {
        providerId,
        error: enrollmentsError,
      });
      throw enrollmentsError; // Re-throw the error to be caught by the outer try-catch
    }

    if (!enrollments || enrollments.length === 0) {
      logger.info("Provider has no trial enrollments", { providerId });
      return [];
    }

    const patientIds = [...new Set(enrollments.map((e) => e.patient_id))];

    if (patientIds.length === 0) {
        return [];
    }

    // Step 2: Fetch the profile details for these unique patient IDs.
    const { data: patients, error: patientsError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url") // Select only needed fields
      .in("id", patientIds);

    if (patientsError) {
      logger.error("Error fetching patient profiles for provider", {
        providerId,
        patientIds,
        error: patientsError,
      });
      throw patientsError; // Re-throw the error
    }

    logger.info(`Found ${patients?.length ?? 0} patients for provider`, {
      providerId,
    });
    return patients || [];

  } catch (error) {
    logger.error("Error in getProviderPatientsAction", { providerId, error });
    return [];
  }
}

// Add other patient-related actions here if needed (e.g., getPatientById, updatePatient) 