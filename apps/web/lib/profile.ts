import { getUserDb } from "@/lib/db/server"
import { adminDb, dbAs } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { cache } from "react"

// Export the Profile type
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Reads the profile of `user`, and creates it when it does not exist yet.
 *
 * On Supabase, the on_auth_user_created trigger creates the profile at sign-up.
 * On a plain PostgreSQL database that trigger cannot run, because the users are
 * in Supabase Auth, not in this database. So the first read creates the row
 * (id and email, as the trigger did). Choosing a role then creates the
 * patient, provider or research partner row through the profiles trigger.
 *
 * Returns null only when no profile exists and none can be created (a user
 * without an email). A database error (for example a missing DATABASE_URL or
 * a migration that is not applied) is thrown, so that callers do not mistake
 * it for a profile without a role.
 *
 * `user` must come from Supabase Auth (`auth.getUser()`), never from request
 * input. The query runs with row-level security as that user. It does not look
 * up the session again: a second lookup that fails would fall back to the
 * anonymous role, which cannot see the profile, and the profile would look
 * missing.
 */
export const fetchUserProfile = cache(async (user: User): Promise<Profile | null> => {
  const db = dbAs({ id: user.id, email: user.email })
  const profile = await db.profiles.findUnique({
    where: { id: user.id },
  })

  if (profile) {
    return profile;
  }

  if (!user.email) {
    logger.warn('User profile not found, and the user has no email to create it with.', { userId: user.id });
    return null;
  }

  // The user comes from Supabase Auth, so creating their own row is authorized.
  logger.info('Creating the missing user profile.', { userId: user.id });
  return adminDb.profiles.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email },
    update: {},
  })
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
