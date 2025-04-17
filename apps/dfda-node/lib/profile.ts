import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Export the Profile type
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Fetches the user profile from the server-side.
 * Requires the authenticated user object.
 * 
 * @param user The authenticated user object from Supabase Auth.
 * @returns The user's profile object or null if not found/error occurred.
 */
export async function getUserProfile(user: User | null): Promise<Profile | null> {
  if (!user) {
    logger.warn('getUserProfile called without a user.');
    return null;
  }

  const supabase = await createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*') // Select all profile fields for now, adjust as needed
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Standard PostgREST code for "Not found"
        logger.warn('User profile not found.', { userId: user.id });
      } else {
        logger.error('Error fetching user profile:', { userId: user.id, error });
      }
      return null;
    }

    logger.info('User profile fetched successfully', { userId: user.id });
    return profile;

  } catch (err) {
    logger.error('Unexpected error in getUserProfile:', { userId: user.id, error: err });
    return null;
  }
}

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

  const supabase = await createClient();

  try {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*') // Return the updated profile
      .single();

    if (error) {
      logger.error('Error updating user profile:', { userId, error });
      return null;
    }

    logger.info('User profile updated successfully', { userId });
    return updatedProfile;
  } catch (err) {
    logger.error('Unexpected error in updateUserProfile:', { userId, error: err });
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

  const supabase = await createClient();

  try {
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating user profile:', { userId: profileData.id, error });
      // Handle specific errors like unique constraint violations if needed
      return null;
    }

    logger.info('User profile created successfully', { userId: profileData.id });
    return newProfile;
  } catch (err) {
    logger.error('Unexpected error in createUserProfile:', { userId: profileData.id, error: err });
    return null;
  }
}

// Add other profile-related functions here (e.g., deleteProfile, client-side fetch) 