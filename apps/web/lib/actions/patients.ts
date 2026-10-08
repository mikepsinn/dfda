"use server";

import { getUserDb } from "@/lib/db/server";
import { Database } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { getServerUser } from "@/lib/server-auth"; // Use the correct auth helper
import { getUserProfile } from "@/lib/profile"; // Import profile helper

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
  const user = await getServerUser(); // Fetch the current user

  // Ensure the user is logged in
  if (!user) {
    logger.error("Unauthorized attempt to fetch provider patients: No user found");
    return []; // Return empty array if no user session
  }

  // Fetch the user's profile using the helper
  const profile = await getUserProfile(user);

  if (!profile) {
     // getUserProfile logs errors internally
     logger.error("Could not fetch provider profile.", { userId: user.id });
     return []; 
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
    const db = await getUserDb();

    // Step 1: Find all unique patient IDs from trial enrollments managed by this provider.
    const enrollments = await db.trial_enrollments.findMany({
      where: { provider_id: providerId },
      select: { patient_id: true },
    });

    if (enrollments.length === 0) {
      logger.info("Provider has no trial enrollments", { providerId });
      return [];
    }

    const patientIds = [...new Set(enrollments.map((e) => e.patient_id))];

    // Step 2: Fetch the profile details for these unique patient IDs.
    const patients = await db.profiles.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, first_name: true, last_name: true, email: true, avatar_url: true }, // Select only needed fields
    });

    logger.info(`Found ${patients.length} patients for provider`, {
      providerId,
    });
    return patients;

  } catch (error) {
    logger.error("Error in getProviderPatientsAction", { providerId, error });
    return [];
  }
}

// Add other patient-related actions here if needed (e.g., getPatientById, updatePatient) 