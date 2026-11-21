import { z } from 'zod'

// The item schemas of the photo analysis (lib/actions/analyze-image.ts). They
// live outside the "use server" file, which may only export async functions.

// --- Ingredient Schema ---
export const IngredientSchema = z.object({
  name: z.string().describe("Name of the ingredient (e.g., 'Enriched Wheat Flour', 'Ascorbic Acid', 'Ibuprofen')."),
  quantity: z.number().nullable().describe("Numerical quantity of the ingredient, if specified (e.g., 200, 10.5). Null if not specified."),
  unit: z.string().nullable().describe("Unit for the quantity, if specified (e.g., 'mg', 'g', '%'). Normalize common units (mcg, μg -> ug). Null if quantity is null or unit not specified."),
}).describe("Represents a single ingredient with optional quantity and unit.");

// --- Base Schema ---
export const BaseSchema = z.object({
  name: z.string().describe("Identify the specific name of the primary item (e.g., \"Cheerios\", \"Advil Liqui-Gels\", \"Banana\"). Be concise."),
  brand: z.string().optional().describe("Brand name, if identifiable (e.g., \"General Mills\", \"Advil\")."),
  upc: z.string().optional().describe("UPC barcode number, if identifiable from any image."),
  details: z.string().optional().describe("(Optional) Provide any relevant additional details not covered by other fields."),
});

// --- Food Schema ---
export const FoodSchema = BaseSchema.extend({
  type: z.literal('food').describe("ONLY use for items primarily intended for consumption as food or beverage (e.g., cereal, soda, bread). CRITICAL: DO NOT use for dietary supplements, medications, pills, capsules, powders etc."),
  servingSize_quantity: z.number().nullable().describe("Serving size quantity (e.g., 30, 1). Null if not specified."),
  servingSize_unit: z.string().nullable().describe("Serving size unit (e.g., 'g', 'cup', 'piece'). Null if quantity is null or unit not specified."),
  calories_per_serving: z.number().nullable().describe("Calories per serving. Null if not specified."),
  fat_per_serving: z.number().nullable().describe("Total Fat per serving in grams. Null if not specified."),
  protein_per_serving: z.number().nullable().describe("Protein per serving in grams. Null if not specified."),
  carbs_per_serving: z.number().nullable().describe("Total Carbohydrates per serving in grams. Null if not specified."),
  ingredients: z.array(IngredientSchema).optional().describe("List of regular food ingredients."),
});

// --- Treatment Schema ---
export const TreatmentSchema = BaseSchema.extend({
  type: z.literal('treatment').describe("Use ONLY for medications (drugs), whether prescription or over-the-counter (e.g., Ibuprofen, Aspirin, prescription medications). DO NOT use for dietary supplements."),
  dosage_form: z.string().optional().describe("Form of the medication (e.g., 'tablet', 'capsule', 'liquid', 'inhaler', 'cream')."),
  dosage_instructions: z.string().optional().describe("Instructions for use (e.g., 'Take two tablets daily', 'Apply to affected area')."),
  active_ingredients: z.array(IngredientSchema).optional().describe("List of ACTIVE pharmaceutical ingredients (APIs), including strength (quantity/unit) if available (e.g., { name: 'Ibuprofen', quantity: 200, unit: 'mg' })."),
  inactive_ingredients: z.array(IngredientSchema).optional().describe("List of INACTIVE ingredients (excipients) identified, common in medications."),
});

// --- Supplement Schema (NEW) ---
export const SupplementSchema = BaseSchema.extend({
  type: z.literal('supplement').describe("Use ONLY for dietary supplements (e.g., vitamins, minerals, herbs, amino acids like Taurine, protein powders, creatine). These are distinct from food and medication."),
  dosage_form: z.string().optional().describe("Form of the supplement (e.g., 'capsule', 'tablet', 'powder', 'liquid', 'gummy')."),
  serving_size_description: z.string().optional().describe("Serving size as text if specified (e.g., '1 scoop', '2 capsules'). Capture numeric quantity/unit in active ingredients if possible."), // Alternative/addition to numeric serving size
  dosage_instructions: z.string().optional().describe("Instructions for use (e.g., 'Take 2 capsules daily', 'Mix one scoop with water')."),
  active_ingredients: z.array(IngredientSchema).optional().describe("List of primary SUPPLEMENT ingredients/components, including strength/amount (quantity/unit) if available (e.g., { name: 'Vitamin C', quantity: 500, unit: 'mg' }, { name: 'Taurine', quantity: 1000, unit: 'mg' })."),
  // Often supplements list 'Other Ingredients' instead of 'Inactive'
  other_ingredients: z.array(IngredientSchema.pick({ name: true })).optional().describe("List of OTHER ingredients identified (often fillers, binders, etc., similar to inactive ingredients but commonly labelled differently on supplements). Just list names."), 
});

// --- Other Schema ---
export const OtherSchema = BaseSchema.extend({
  type: z.literal('other').describe("Use ONLY if the item CANNOT be classified as 'food', 'treatment' (medication), or 'supplement' based on the definitions above (e.g., cleaning supplies, pet food, cosmetics)."),
  // No additional fields specific to 'other' for now
});


// --- Enhanced Discriminated Union Schema ---
// Although declared, it's only used for type inference below, hence the ESLint warning.
// const EnhancedAiOutputSchema = z.discriminatedUnion(...) 
// Instead of declaring it as a const, we define the type directly.
// It's better to declare it explicitly if used in multiple places, but for now, this resolves the warning.

// Type for the successful result using z.infer directly on the union definition
export type AnalyzedImageResult = z.infer<z.ZodDiscriminatedUnion<"type", [
    typeof FoodSchema,
    typeof TreatmentSchema,
    typeof SupplementSchema,
    typeof OtherSchema
]>>
