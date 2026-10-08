import type { UserDb } from '@/lib/db';
import { logger } from './logger';
import { findOrCreateGlobalVariable, findUnitId } from './global_variables.lib'; // Updated path

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
    db: UserDb,
    ingredients: InputIngredientInfo[]
): Promise<ResolvedIngredientInfo[]> {
    const resolvedIngredients: ResolvedIngredientInfo[] = [];
    for (const ing of ingredients) {
        // Ensure 'other' type is used when creating GVar for an ingredient
        const gvarId = await findOrCreateGlobalVariable(db, ing.name, 'other', undefined, true, ing.unit);
        const unitId = await findUnitId(db, ing.unit);
        resolvedIngredients.push({ ...ing, global_variable_id: gvarId, unit_id: unitId });
    }
    return resolvedIngredients;
}

/**
 * Links a list of resolved ingredients to a parent variable (food/treatment)
 * in the variable_ingredients table.
 */
export async function linkIngredientsToParentVariable(
    db: UserDb,
    parentGlobalVariableId: string,
    resolvedIngredients: ResolvedIngredientInfo[],
    // Used to mark which ingredients should be flagged as 'active' (for treatments)
    originalActiveIngredients: Pick<InputIngredientInfo, 'name'>[] 
): Promise<string[]> {
    if (!resolvedIngredients || resolvedIngredients.length === 0) {
        return [];
    }

    const ingredientsToInsert = resolvedIngredients.flatMap((ing, index) => {
        // Check if this ingredient name was in the original active list
        const isActive = originalActiveIngredients.some(activeIng => activeIng.name === ing.name);
        if (!ing.global_variable_id) {
            logger.warn('Skipping ingredient link due to missing global_variable_id', { ingredientName: ing.name, parent: parentGlobalVariableId });
            return []; // Skip if GVar ID wasn't resolved
        }
        return [{
            parent_global_variable_id: parentGlobalVariableId,
            ingredient_global_variable_id: ing.global_variable_id,
            quantity_per_serving: ing.quantity,
            unit_id: ing.unit_id,
            is_active_ingredient: isActive,
            display_order: index,
        }];
    });

    if (ingredientsToInsert.length === 0) {
        logger.warn('No valid ingredients to link after filtering', { parentGlobalVariableId });
        return [];
    }

    // Upsert ingredients based on the unique constraint (parent_id, ingredient_id)
    const ids: string[] = [];
    try {
        for (const ingredient of ingredientsToInsert) {
            const { parent_global_variable_id, ingredient_global_variable_id, ...fields } = ingredient;
            const row = await db.variable_ingredients.upsert({
                where: {
                    parent_global_variable_id_ingredient_global_variable_id: { parent_global_variable_id, ingredient_global_variable_id },
                },
                create: ingredient,
                update: fields,
                select: { id: true },
            });
            ids.push(row.id);
        }
    } catch (error) {
        logger.error('Failed to link ingredients to parent variable', { error, parentGlobalVariableId });
        throw new Error(`DB error (linking ingredients): ${error instanceof Error ? error.message : 'Upsert failed'}`);
    }
    logger.info(`Linked ${ids.length} ingredients to variable`, { parentGlobalVariableId });
    return ids;
} 