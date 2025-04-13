"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'

// Represents a row from the global_variables table
export type GlobalVariable = Database['public']['Tables']['global_variables']['Row']

/**
 * Fetches details for a specific global variable by its ID.
 * Note: This action does not check user ownership as global variables are public concepts.
 */
export async function getGlobalVariableByIdAction(globalVariableId: string): Promise<GlobalVariable | null> {
    const supabase = await createClient();
    logger.info("Fetching global variable by ID", { globalVariableId });

    if (!globalVariableId) {
        logger.warn("getGlobalVariableByIdAction called with no ID");
        return null;
    }

    const { data, error } = await supabase
        .from('global_variables')
        .select('*')
        .eq('id', globalVariableId)
        .maybeSingle();

    if (error) {
        logger.error("Error fetching global variable", { globalVariableId, error });
        // Don't throw, return null to allow the calling page to handle "not found"
        return null;
    }

    return data;
}

// TODO: Add other actions for global_variables if needed (search, list by category etc.) 