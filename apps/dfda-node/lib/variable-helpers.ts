import { UNIT_IDS } from '@/lib/constants/units';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories';

/**
 * Enum defining the different types of inputs we might render for a variable.
 */
export type VariableInputType = 
  | 'numeric' 
  | 'boolean_yes_no' // For UNIT_IDS.BOOLEAN_1_YES_TRUE_0_NO_FALSE_
  | 'rating_1_5'     // For UNIT_IDS.ONE_TO_FIVE_SCALE
  | 'rating_1_10'    // For UNIT_IDS.ONE_TO_TEN_SCALE
  | 'rating_0_10'    // For UNIT_IDS.ZERO_TO_TEN_SCALE
  | 'other';         // Default or unhandled

/**
 * Determines the appropriate input type for a variable based on its unit and category.
 * 
 * @param params - Object containing unitId and variableCategory.
 * @param params.unitId - The unit ID of the variable.
 * @param params.variableCategory - The category ID of the variable.
 * @returns The determined VariableInputType.
 */
export function getVariableInputType({
  unitId,
  variableCategory,
}: {
  unitId: string | null;
  variableCategory: string | null;
}): VariableInputType {
  if (!unitId) {
    return 'other'; // Cannot determine without unit
  }

  // 1. Check for Boolean Type
  if (unitId === UNIT_IDS.BOOLEAN_1_YES_TRUE_0_NO_FALSE_) {
    // We could potentially add a check for variableCategory === HEALTH_AND_PHYSIOLOGY if needed
    // but the unit itself is quite specific.
    return 'boolean_yes_no';
  }

  // 2. Check for Rating Scales
  switch (unitId) {
    case UNIT_IDS.ONE_TO_FIVE_SCALE:
      return 'rating_1_5';
    case UNIT_IDS.ONE_TO_TEN_SCALE:
      return 'rating_1_10';
    case UNIT_IDS.ZERO_TO_TEN_SCALE:
      return 'rating_0_10';
  }

  // 3. Default to Numeric (or 'other' if we want stricter numeric checking)
  // For now, assume most other things are numeric entry.
  // We could add more specific checks (e.g., for temperature, weight) if needed later.
  // Consider adding an 'other' category if many units don't fit numeric input.
  return 'numeric'; 
}

/**
 * Helper to get the min/max range for known rating scales.
 * 
 * @param inputType - The VariableInputType determined for the variable.
 * @returns A tuple [min, max] or null if not a known rating scale.
 */
export function getRatingRange(inputType: VariableInputType): [number, number] | null {
    switch (inputType) {
        case 'rating_1_5':
            return [1, 5];
        case 'rating_1_10':
            return [1, 10];
        case 'rating_0_10':
            return [0, 10];
        default:
            return null;
    }
} 