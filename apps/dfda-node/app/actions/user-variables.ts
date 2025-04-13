"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'

export type UserVariable = Database['public']['Tables']['user_variables']['Row']

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

// TODO: Add actions for creating/updating/deleting user_variables if needed elsewhere 