import { getUserDb } from "@/lib/db/server"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { cache } from "react"

// Export the Profile type
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Reads the profile of `user`.
 *
 * Returns null only when no profile row exists. A database error (for example
 * a missing DATABASE_URL or a migration that is not applied) is thrown, so that
 * callers do not mistake it for a profile without a role.
 */
export const fetchUserProfile = cache(async (user: User): Promise<Profile | null> => {
  const db = await getUserDb()
  const profile = await db.profiles.findUnique({
    where: { id: user.id },
  })

  if (!profile) {
    logger.warn('User profile not found.', { userId: user.id });
    return null;
  }

  return profile;
})

/**
 * Fetches the user profile from the server-side.
 * Requires the authenticated user object.
 * 
 * @param user The authenticated user object from Supabase Auth.
 * @returns The user's profile object or null if not found/error occurred.
 */
export const getUserProfile = cache( async (user: User | null): Promise<Profile | null> => {
  if (!user) {
    logger.warn('getUserProfile called without a user object.');
    return null;
  }

  try {
    const profile = await fetchUserProfile(user)
    if (profile) {
      logger.info('User profile fetched successfully', { userId: user.id });
    }
    return profile;

  } catch (err) {
    logger.error('Error fetching user profile:', { userId: user.id, error: err });
    return null;
  }
} )

// Type for profile updates (allow partial updates)
// Export if needed elsewhere, otherwise keep internal
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Updates a user's profile on the server-side.
 * 
 * @param userId The ID of the user whose profile is to be updated.
 * @param updates The partial profile data to update.
 * @returns The updated profile object or null if an error occurred.
 */
export async function updateUserProfile(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
  if (!userId) {
    logger.warn('updateUserProfile called without a userId.');
    return null;
  }
  if (!updates || Object.keys(updates).length === 0) {
    logger.warn('updateUserProfile called without updates.');
    return null; // Or maybe return the existing profile?
  }

  try {
    const db = await getUserDb();
    const updatedProfile = await db.profiles.update({
      where: { id: userId },
      data: updates,
    });

    logger.info('User profile updated successfully', { userId });
    return updatedProfile;
  } catch (err) {
    logger.error('Error updating user profile:', { userId, error: err });
    return null;
  }
}

// Type for profile inserts (might require specific fields)
// Export if needed elsewhere, otherwise keep internal
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

/**
 * Creates a new user profile on the server-side.
 * 
 * @param profileData The data for the new profile.
 * @returns The created profile object or null if an error occurred.
 */
export async function createUserProfile(profileData: ProfileInsert): Promise<Profile | null> {
  if (!profileData || !profileData.id) {
    logger.warn('createUserProfile called without profile data or user ID.');
    return null;
  }

  try {
    const db = await getUserDb();
    const newProfile = await db.profiles.create({
      data: profileData,
    });

    logger.info('User profile created successfully', { userId: profileData.id });
    return newProfile;
  } catch (err) {
    // Handle specific errors like unique constraint violations if needed
    logger.error('Error creating user profile:', { userId: profileData.id, error: err });
    return null;
  }
}

// Add other profile-related functions here (e.g., deleteProfile, client-side fetch)
