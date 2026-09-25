import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { logger } from './logger';
import { findOrCreateGlobalVariable, findUnitId } from './global_variables.lib'; // Updated path

// Define the resolved Supabase client type here or import from a shared types file
type ResolvedSupabaseClient = SupabaseClient<Database, "public">;

// Define necessary types (consider moving to a shared types file later)
// Type for input ingredient data (minimal structure needed by resolveIngredientGvars)
interface InputIngredientInfo {
    name: string;
    quantity?: number | null;
    unit?: string | null;
}

// Type for ingredient data after resolving GVar ID and Unit ID
interface ResolvedIngredientInfo extends InputIngredientInfo {
    global_variable_id?: string;
    unit_id?: string | null;
}

/**
 * Takes an array of ingredients, finds/creates their corresponding global variables,
 * finds their unit IDs, and returns the ingredients with this resolved info.
 */
export async function resolveIngredientGvars(
    supabase: ResolvedSupabaseClient,
    ingredients: InputIngredientInfo[]
): Promise<ResolvedIngredientInfo[]> {
    const resolvedIngredients: ResolvedIngredientInfo[] = [];
    for (const ing of ingredients) {
        // Ensure 'other' type is used when creating GVar for an ingredient
        const gvarId = await findOrCreateGlobalVariable(supabase, ing.name, 'other', undefined, true, ing.unit);
        const unitId = await findUnitId(supabase, ing.unit);
        resolvedIngredients.push({ ...ing, global_variable_id: gvarId, unit_id: unitId });
    }
    return resolvedIngredients;
}

/**
 * Links a list of resolved ingredients to a parent variable (food/treatment)
 * in the variable_ingredients table.
 */
export async function linkIngredientsToParentVariable(
    supabase: ResolvedSupabaseClient,
    parentGlobalVariableId: string,
    resolvedIngredients: ResolvedIngredientInfo[],
    // Used to mark which ingredients should be flagged as 'active' (for treatments)
    originalActiveIngredients: Pick<InputIngredientInfo, 'name'>[] 
): Promise<string[]> {
    if (!resolvedIngredients || resolvedIngredients.length === 0) {
        return [];
    }

    const ingredientsToInsert = resolvedIngredients.map((ing, index) => {
        // Check if this ingredient name was in the original active list
        const isActive = originalActiveIngredients.some(activeIng => activeIng.name === ing.name);
        if (!ing.global_variable_id) {
            logger.warn('Skipping ingredient link due to missing global_variable_id', { ingredientName: ing.name, parent: parentGlobalVariableId });
            return null; // Skip if GVar ID wasn't resolved
        }
        return {
            parent_global_variable_id: parentGlobalVariableId,
            ingredient_global_variable_id: ing.global_variable_id,
            quantity_per_serving: ing.quantity,
            unit_id: ing.unit_id,
            is_active_ingredient: isActive,
            display_order: index,
        };
    }).filter(Boolean) as Database['public']['Tables']['variable_ingredients']['Insert'][]; // Filter out nulls and assert type

    if (ingredientsToInsert.length === 0) {
        logger.warn('No valid ingredients to link after filtering', { parentGlobalVariableId });
        return [];
    }

    // Upsert ingredients based on the unique constraint (parent_id, ingredient_id)
    const { data, error } = await supabase
        .from('variable_ingredients')
        .upsert(ingredientsToInsert, { onConflict: 'parent_global_variable_id, ingredient_global_variable_id' })
        .select('id');

    if (error || !data) {
        logger.error('Failed to link ingredients to parent variable', { error, parentGlobalVariableId });
        throw new Error(`DB error (linking ingredients): ${error?.message || 'Upsert failed'}`);
    }
    logger.info(`Linked ${data.length} ingredients to variable`, { parentGlobalVariableId });
    return data.map(d => d.id);
} 