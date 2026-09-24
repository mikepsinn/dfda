"use server"

import { createClient } from '@/utils/supabase/server'
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
    const supabase = await createClient();
    logger.info("Fetching user variable by ID", { userVariableId, userId });

    if (!userVariableId || !userId) {
        logger.warn("getUserVariableByIdAction called with missing IDs");
        return null;
    }

    const { data, error } = await supabase
        .from('user_variables')
        .select('*')
        .eq('id', userVariableId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        logger.error("Error fetching user variable", { userVariableId, userId, error });
        // Don't throw, return null to allow the page to handle "not found"
        return null;
    }

    return data;
}

/**
 * Fetches all user variables for a user with associated global variable information
 */
export async function getAllUserVariablesAction(userId: string): Promise<any[]> {
    const supabase = await createClient();
    logger.info("Fetching all user variables", { userId });

    if (!userId) {
        logger.warn("getAllUserVariablesAction called with missing user ID");
        return [];
    }

    const { data, error } = await supabase
        .from('user_variables')
        .select(`
            id,
            global_variable_id,
            global_variables(id, name, variable_category_id),
            preferred_unit_id,
            units:preferred_unit_id(id, abbreviated_name)
        `)
        .eq('user_id', userId)
        .is('deleted_at', null);

    if (error) {
        logger.error("Error fetching all user variables", { userId, error });
        return [];
    }

    return data || [];
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_variables")
      .select(`
        *,
        global_variables ( name, emoji )
      `)
      .eq("user_id", userId)
      .is("deleted_at", null) // Ensure we only get active variables
      .order("created_at", { ascending: true }); // Optional: order by creation date

    if (error) {
      logger.error("getUserVariablesWithDetailsAction: Error fetching user variables", { userId, error });
      return { success: false, error: error.message };
    }

    logger.info("getUserVariablesWithDetailsAction: Fetched user variables successfully", { userId, count: data?.length ?? 0 });
    return { success: true, data: data as UserVariableWithDetails[] }; // Cast needed because of join

  } catch (error: any) {
    logger.error("getUserVariablesWithDetailsAction: Unhandled error", { userId, error });
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_variables")
      .select(`
        *,
        global_variables ( 
            name, 
            emoji, 
            default_unit_id, 
            variable_category_id, 
            units: units!inner (abbreviated_name) 
        ),
        units:preferred_unit_id ( abbreviated_name )
      `)
      .eq("id", userVariableId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      logger.error("getUserVariableDetailsAction: Error fetching user variable details", { userId, userVariableId, error });
      return { success: false, error: error.message };
    }

    if (!data) {
       logger.warn("getUserVariableDetailsAction: User variable not found or access denied", { userId, userVariableId });
      return { success: false, error: "Variable not found." };
    }

    logger.info("getUserVariableDetailsAction: Fetched user variable details successfully", { userId, userVariableId });
    // The select might return slightly different structure, cast carefully or adjust select
    return { success: true, data: data as UserVariableWithDetails };

  } catch (error: any) {
    logger.error("getUserVariableDetailsAction: Unhandled error", { userId, userVariableId, error });
    return { success: false, error: "An unexpected error occurred." };
  }
}

// TODO: Add actions for creating/updating/deleting user_variables if needed elsewhere 