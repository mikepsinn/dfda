"use server"

import { getUserDb } from '@/lib/db/server'
import type { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { unstable_noStore as noStore } from 'next/cache'
import type { MeasurementWithUnits } from './measurements'

export type UserVariable = Database['public']['Tables']['user_variables']['Row']

// Define the type for the joined result
export type UserVariableWithDetails = Database["public"]["Tables"]["user_variables"]["Row"] & {
  global_variables: {
    name: string;
    emoji: string | null;
    default_unit_id: string; 
    variable_category_id: string; // Add category ID
    units?: { abbreviated_name: string | null } | null; // Optional join for unit name
  } | null;
  units?: { abbreviated_name: string | null } | null; // Preferred unit name
};

// Add the new type definition here
export type UserVariableWithMeasurements = UserVariableWithDetails & {
  measurements: MeasurementWithUnits[];
};

/**
 * Fetches a specific user variable by its ID, ensuring it belongs to the user.
 */
export async function getUserVariableByIdAction(userVariableId: string, userId: string): Promise<UserVariable | null> {
    logger.info("Fetching user variable by ID", { userVariableId, userId });

    if (!userVariableId || !userId) {
        logger.warn("getUserVariableByIdAction called with missing IDs");
        return null;
    }

    try {
        const db = await getUserDb();
        return await db.user_variables.findFirst({
            where: { id: userVariableId, user_id: userId },
        });
    } catch (error) {
        logger.error("Error fetching user variable", { userVariableId, userId, error });
        // Don't throw, return null to allow the page to handle "not found"
        return null;
    }
}

/**
 * Fetches all user variables for a user with associated global variable information
 */
export async function getAllUserVariablesAction(userId: string): Promise<any[]> {
    logger.info("Fetching all user variables", { userId });

    if (!userId) {
        logger.warn("getAllUserVariablesAction called with missing user ID");
        return [];
    }

    try {
        const db = await getUserDb();
        return await db.user_variables.findMany({
            where: { user_id: userId, deleted_at: null },
            select: {
                id: true,
                global_variable_id: true,
                global_variables: { select: { id: true, name: true, variable_category_id: true } },
                preferred_unit_id: true,
                units: { select: { id: true, abbreviated_name: true } }, // Preferred unit
            },
        });
    } catch (error) {
        logger.error("Error fetching all user variables", { userId, error });
        return [];
    }
}

/**
 * Fetches all user variables for a given user ID, joining with global_variables 
 * to get the name and emoji.
 */
export async function getUserVariablesWithDetailsAction(userId: string): Promise<{ success: boolean; data?: UserVariableWithDetails[]; error?: string }> {
  noStore(); // Ensure data isn't cached across requests
  logger.info("getUserVariablesWithDetailsAction: Called", { userId });

  if (!userId) {
    logger.warn("getUserVariablesWithDetailsAction: No user ID provided");
    return { success: false, error: "User not authenticated" };
  }

  try {
    const db = await getUserDb();
    const data: UserVariableWithDetails[] = await db.user_variables.findMany({
      where: {
        user_id: userId,
        deleted_at: null, // Ensure we only get active variables
      },
      include: {
        global_variables: {
          select: { name: true, emoji: true, default_unit_id: true, variable_category_id: true },
        },
      },
      orderBy: { created_at: "asc" }, // Optional: order by creation date
    });

    logger.info("getUserVariablesWithDetailsAction: Fetched user variables successfully", { userId, count: data.length });
    return { success: true, data };

  } catch (error) {
    logger.error("getUserVariablesWithDetailsAction: Error fetching user variables", { userId, error });
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Fetches a single user variable by ID for a specific user, including joined 
 * global variable details (name, emoji, default unit) and preferred unit.
 */
export async function getUserVariableDetailsAction(userVariableId: string, userId: string): Promise<{ success: boolean; data?: UserVariableWithDetails; error?: string }> {
  noStore();
  logger.info("getUserVariableDetailsAction: Called", { userVariableId, userId });

  if (!userVariableId || !userId) {
    logger.warn("getUserVariableDetailsAction: Missing IDs");
    return { success: false, error: "Invalid request parameters." };
  }

  try {
    const db = await getUserDb();
    const data: UserVariableWithDetails | null = await db.user_variables.findFirst({
      where: {
        id: userVariableId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        global_variables: {
          select: {
            name: true,
            emoji: true,
            default_unit_id: true,
            variable_category_id: true,
            units: { select: { abbreviated_name: true } }, // Default unit
          },
        },
        units: { select: { abbreviated_name: true } }, // Preferred unit
      },
    });

    if (!data) {
       logger.warn("getUserVariableDetailsAction: User variable not found or access denied", { userId, userVariableId });
      return { success: false, error: "Variable not found." };
    }

    logger.info("getUserVariableDetailsAction: Fetched user variable details successfully", { userId, userVariableId });
    return { success: true, data };

  } catch (error) {
    logger.error("getUserVariableDetailsAction: Error fetching user variable details", { userId, userVariableId, error });
    return { success: false, error: "An unexpected error occurred." };
  }
}

// TODO: Add actions for creating/updating/deleting user_variables if needed elsewhere 