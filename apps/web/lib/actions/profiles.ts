"use server"

import { z } from "zod"
import { getUserDb } from "@/lib/db/server"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { getUserProfile, updateUserProfile } from "@/lib/profile"
import { getServerUser } from "@/lib/server-auth"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type UserTypeEnum = Database["public"]["Enums"]["user_type_enum"]

const optionalName = z.string().trim().max(100).nullable().transform((value) => value || null)

/**
 * The fields of the profile form. Other keys are dropped: the email, the role
 * and the dates are not the user's to change here (and the database refuses
 * them, db/migrations/20261024040000_alter_profiles_user_updates.sql).
 */
const profileFormSchema = z.object({
  first_name: optionalName.optional(),
  last_name: optionalName.optional(),
  timezone: z.string().trim().max(100).nullable().optional(),
})

export type ProfileFormUpdate = z.input<typeof profileFormSchema>

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

/** Saves the profile form of the signed-in user. */
export async function updateProfileAction(updates: ProfileFormUpdate): Promise<Profile | null> {
  const user = await getServerUser()
  if (!user) throw new Error("Sign in to change your profile.")
  const parsed = profileFormSchema.safeParse(updates)
  if (!parsed.success) throw new Error("Check the name and the time zone.")
  const updatedProfile = await updateUserProfile(user.id, { ...parsed.data, updated_at: new Date() })
  if (!updatedProfile) {
      throw new Error("Failed to update profile")
  }
  return updatedProfile;
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