import type { UserDb } from '@/lib/db';
import { logger } from './logger';
import slugify from 'slugify';
import { UNIT_IDS, UNITS_DATA } from '@/lib/constants/units'; // Assuming constants are structured like this
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories';

/**
 * Finds an existing global variable by name/slug or creates a new one.
 * Handles both regular variables (food, treatment) and ingredients.
 */
export async function findOrCreateGlobalVariable(
    db: UserDb,
    name: string,
    type: 'food' | 'treatment' | 'other',
    details?: string,
    // Flag for ingredients
    isIngredient: boolean = false,
    ingredientUnit?: string | null
): Promise<string> {
    const trimmedName = name.trim();
    // More robust slug generation might be needed depending on requirements
    const slugId = slugify(trimmedName, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) || `gvar-${Date.now()}`; // Fallback slug

    let variableCategoryId: string;
    let defaultUnitId: string;

    if (isIngredient) {
        variableCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS; // Or a specific 'Ingredient' category if created
        const unitEntry = Object.entries(UNIT_IDS).find(([, id]) => 
            ingredientUnit?.toLowerCase() === id.toLowerCase() || 
            (UNITS_DATA[id]?.abbreviated_name && ingredientUnit?.toLowerCase() === UNITS_DATA[id]?.abbreviated_name?.toLowerCase())
        );
        defaultUnitId = unitEntry ? unitEntry[1] : UNIT_IDS.DIMENSIONLESS;
    } else {
        switch (type) {
            case 'food':
                variableCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS;
                defaultUnitId = UNIT_IDS.GRAM;
                break;
            case 'treatment':
                variableCategoryId = VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS;
                defaultUnitId = UNIT_IDS.DIMENSIONLESS;
                break;
            case 'other':
            default:
                variableCategoryId = VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY; // Default category
                defaultUnitId = UNIT_IDS.DIMENSIONLESS;
                break;
        }
    }

    if (!variableCategoryId || !defaultUnitId) {
        logger.error('Configuration error: Missing category/unit ID in findOrCreateGlobalVariable', { name, type, isIngredient });
        throw new Error('Configuration error: Missing category/unit ID.');
    }

    // 1. Try finding by slugified ID
    let existingById;
    try {
        existingById = await db.global_variables.findUnique({
            where: { id: slugId },
            select: { id: true, name: true, description: true, variable_category_id: true },
        });
    } catch (findByIdError) {
        logger.error('DB error finding GVar by ID', { id: slugId, error: findByIdError });
        throw new Error(`DB error (find GVar by ID ${slugId}): ${errorMessage(findByIdError)}`);
    }
    if (existingById) {
        // Optional: Check if category matches, update if needed?
        if (existingById.variable_category_id !== variableCategoryId) {
            logger.warn('Found GVar by ID but category mismatch', { id: slugId, foundCategory: existingById.variable_category_id, expectedCategory: variableCategoryId });
            // Decide on update strategy - potentially update description/category?
        }
        logger.debug('Found existing GVar by ID', { id: existingById.id });
        return existingById.id;
    }

    // 2. Try finding by name and category (case-insensitive)
    let existingByName;
    try {
        existingByName = await db.global_variables.findFirst({
            where: {
                name: { equals: trimmedName, mode: 'insensitive' },
                variable_category_id: variableCategoryId,
            },
            select: { id: true },
        });
    } catch (findByNameError) {
        logger.error('DB error finding GVar by Name', { name: trimmedName, category: variableCategoryId, error: findByNameError });
        throw new Error(`DB error (find GVar by Name ${trimmedName}): ${errorMessage(findByNameError)}`);
    }
    if (existingByName) {
        logger.debug('Found existing GVar by Name', { id: existingByName.id });
        // TODO: Consider updating description?
        return existingByName.id;
    }

    // 3. Create new global variable
    const description = isIngredient ? `Ingredient: ${trimmedName}` : details?.trim();
    let newVar;
    try {
        newVar = await db.global_variables.create({
            data: {
                id: slugId,
                name: trimmedName,
                description: description,
                variable_category_id: variableCategoryId,
                default_unit_id: defaultUnitId
            },
            select: { id: true },
        });
    } catch (createError) {
        logger.error('DB error creating GVar', { id: slugId, name: trimmedName, error: createError });
        throw new Error(`DB error (create GVar ${slugId}): ${errorMessage(createError)}`);
    }
    logger.info('Created new global variable', { id: newVar.id, name: trimmedName, category: variableCategoryId });
    return newVar.id;
}

/**
 * Finds the ID of a unit based on its string representation (name or abbreviation).
 * Checks constants first, then queries the database as a fallback.
 */
export async function findUnitId(db: UserDb, unitString?: string | null): Promise<string | null> {
    if (!unitString) return null;
    const trimmedUnit = unitString.trim().toLowerCase();
    if (!trimmedUnit) return null;

    // Check cache/constants first
    const unitEntry = Object.entries(UNIT_IDS).find(([, id]) => 
        trimmedUnit === id.toLowerCase() || 
        trimmedUnit === UNITS_DATA[id]?.name?.toLowerCase() ||
        trimmedUnit === UNITS_DATA[id]?.abbreviated_name?.toLowerCase()
    );
    if (unitEntry) return unitEntry[1];

    // If not in constants, query DB
    logger.warn('Unit not found in constants, querying DB', { unitString });
    let unitData;
    try {
        unitData = await db.units.findFirst({
            where: {
                OR: [
                    { name: { equals: trimmedUnit, mode: 'insensitive' } },
                    { abbreviated_name: { equals: trimmedUnit, mode: 'insensitive' } },
                ],
            },
            select: { id: true },
        });
    } catch (error) {
        logger.error('DB error finding unit ID', { unitString, error });
        return null; // Non-fatal
    }
    if (!unitData) {
        logger.warn('Unit ID not found in DB for string', { unitString });
    }
    return unitData?.id ?? null;
} 

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
