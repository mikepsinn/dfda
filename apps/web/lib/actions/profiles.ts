"use server"

import { getUserDb } from "@/lib/db/server"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { getUserProfile, createUserProfile, updateUserProfile } from "@/lib/profile"
import { getServerUser } from "@/lib/server-auth"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
type UserTypeEnum = Database["public"]["Enums"]["user_type_enum"]

export async function getProfileByIdAction(id: string): Promise<Profile | null> {
  try {
    const db = await getUserDb()
    return await db.profiles.findUnique({ where: { id } })
  } catch (error) {
    logger.error("Error fetching profile:", error)
    return null
  }
}

export async function getProfilesByTypeAction(type: UserTypeEnum): Promise<Profile[]> {
  try {
    const db = await getUserDb()
    return await db.profiles.findMany({
      where: { user_type: type },
      orderBy: { created_at: "desc" },
    })
  } catch (error) {
    logger.error("Error fetching profiles by type:", error)
    throw new Error("Failed to fetch profiles by type")
  }
}

export async function createProfileAction(profile: ProfileInsert): Promise<Profile | null> {
  const newProfile = await createUserProfile(profile);
  if (!newProfile) {
      throw new Error("Failed to create profile")
  }
  return newProfile;
}

export async function updateProfileAction(id: string, updates: ProfileUpdate): Promise<Profile | null> {
  const updatesWithTimestamp = { ...updates, updated_at: new Date() };
  const updatedProfile = await updateUserProfile(id, updatesWithTimestamp);
  if (!updatedProfile) {
      throw new Error("Failed to update profile")
  }
  return updatedProfile;
}

export async function deleteProfileAction(id: string): Promise<void> {
  try {
    const db = await getUserDb()
    await db.profiles.deleteMany({ where: { id } })
  } catch (error) {
    logger.error("Error deleting profile:", error)
    throw new Error("Failed to delete profile")
  }
}

export async function getCurrentUserProfileAction(): Promise<Profile | null> {
  const user = await getServerUser();
  if (!user) {
    logger.warn("getCurrentUserProfileAction: No authenticated user found.")
    return null;
  }
  return await getUserProfile(user);
}

export async function updateUserProfileTimezoneAction(timezone: string): Promise<{ success: boolean; error?: string }> {
    const user = await getServerUser();

    if (!user) {
        logger.error("Timezone update: User not authenticated");
        return { success: false, error: "Authentication failed." }; 
    }

    if (!timezone || typeof timezone !== 'string' || timezone.length === 0) {
        logger.warn("Timezone update: Invalid timezone provided", { userId: user.id, timezone });
        return { success: false, error: "Invalid timezone." };
    }

    const updatedProfile = await updateUserProfile(user.id, { timezone });

    if (!updatedProfile) {
        return { success: false, error: "Failed to update profile timezone." };
    }
            
    logger.info("Profile timezone update successful", { userId: user.id, timezone });
    return { success: true };
} 