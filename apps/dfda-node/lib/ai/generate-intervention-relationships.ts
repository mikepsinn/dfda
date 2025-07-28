import { z } from 'zod';
import { generateObject, NoObjectGeneratedError } from 'ai';
// Remove SupabaseClient import if no checks are done
// import { SupabaseClient } from '@supabase/supabase-js'; 
import { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { defaultGoogleModel } from './google';
import {
  publicGlobalVariablesInsertSchemaSchema,
  publicGlobalVariableRelationshipsInsertSchemaSchema
} from '@/lib/database.schemas';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories';
import { UNIT_IDS } from '@/lib/constants/units';

// Define explicit types for Insert objects
type GVInsert = Database['public']['Tables']['global_variables']['Insert'];
type RelInsert = Database['public']['Tables']['global_variable_relationships']['Insert'];


const aiModel = defaultGoogleModel;
const LOG_PREFIX = '[generate-intervention-relationships]';

// --- Zod Enums from Constants ---
const variableCategoryIds = Object.values(VARIABLE_CATEGORY_IDS);
const unitIds = Object.values(UNIT_IDS);

const VariableCategoryIdEnum = variableCategoryIds.length > 0
  ? z.enum(variableCategoryIds as [string, ...string[]])
  : z.string();

const UnitIdEnum = unitIds.length > 0
  ? z.enum(unitIds as [string, ...string[]])
  : z.string();

const RelationshipCategoryEnum = z.enum(['Efficacy', 'Safety', 'Mechanism', 'Correlation']);

// --- Zod Schemas for AI (Keep as is) ---
const AISuggestedOutcomeVariableSchema = z.object({
  name: z.string().describe("A concise, descriptive name for the outcome variable (e.g., 'Systolic Blood Pressure', 'HbA1c', 'Subjective Mood Score')."),
  description: z.string().optional().describe("A brief explanation of what the variable measures."),
  variable_category_id: VariableCategoryIdEnum.describe("The most appropriate category ID for this variable."),
  default_unit_id: UnitIdEnum.describe("The most common or standard unit ID used to measure this variable.")
});

const AIOutcomeVariableResponseSchema = z.array(AISuggestedOutcomeVariableSchema);

const AIRelationshipSuggestionSchema = publicGlobalVariableRelationshipsInsertSchemaSchema.pick({
  outcome_global_variable_id: true,
  category: true,
  is_positive_outcome: true,
  finding_specific_notes: true,
  percentage_change: true,
  absolute_change_value: true,
  absolute_change_unit_id: true,
  baseline_description: true,
  nnh: true,
  nnt: true,
}).extend({
  outcome_global_variable_id: z.string().describe("The outcome variable ID this relationship applies to."),
  category: RelationshipCategoryEnum.describe("Category for the relationship (Efficacy, Safety, Mechanism, Correlation)."),
  is_positive_outcome: z.boolean().describe("Is the typical desired effect positive (true) or negative (false)?"),
  finding_specific_notes: z.string().describe("Brief summary of the expected link or effect."),
  percentage_change: z.number().describe("Estimate for the typical *percentage* change (e.g., -15 for 15% decrease)."),
  absolute_change_value: z.number().describe("Estimate for the typical *absolute* change (e.g., -10 for a 10 unit decrease)."),
  absolute_change_unit_id: UnitIdEnum.describe("The unit ID for the 'absolute_change_value'. Select from the provided unit list."),
  baseline_description: z.string().describe("Plausible baseline description (e.g., \"(baseline: 100 units)\", \"(vs. placebo)\")."),
  nnh: z.number().describe("Estimated Number Needed to Harm (if applicable, otherwise provide plausible number like 9999)."),
  nnt: z.number().describe("Estimated Number Needed to Treat (if applicable, otherwise provide plausible number like 9999)."),
}).describe("REQUIRED details about the relationship for demo data, including estimates.");

const AIRelationshipResponseSchema = z.array(AIRelationshipSuggestionSchema);


// --- Main Function --- RETURN TYPE CHANGED

// Define return type for generated SQL data
interface GeneratedSqlData {
  newVariables: GVInsert[];
  newRelationships: RelInsert[];
}

interface GenerationResult {
  success: boolean;
  message: string;
  data?: GeneratedSqlData; // Contains the data instead of IDs
  errors?: any[];
}

// --- Utility Function (Keep as is) ---
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Uses AI to suggest affected outcome variables and relationships for an intervention,
 * returning the data structures ready for SQL generation.
 *
 * @param predictorGlobalVariableId The ID of the intervention/predictor global variable.
 * @param predictorName The name of the predictor (for better AI prompts).
 * @param citationId A placeholder or real citation ID to associate with the generated relationships.
 * @returns Promise<GenerationResult> An object indicating success/failure and the generated data.
 */
export async function generateInterventionSqlData(
  predictorGlobalVariableId: string,
  predictorName: string, // Added predictor name
  citationId: string
): Promise<GenerationResult> {
  logger.info(`${LOG_PREFIX} Starting SQL data generation for predictor: ${predictorName} (${predictorGlobalVariableId})`);
  const errors: any[] = [];
  // Initialize arrays to hold data objects
  const generatedVariables: GVInsert[] = [];
  const generatedRelationships: RelInsert[] = [];
  const outcomeIdsToRelate: string[] = []; // Still need this temporarily

  if (!aiModel) {
    logger.error(`${LOG_PREFIX} AI model not configured.`);
    return { success: false, message: "AI model not configured.", errors: ['AI model not available'] };
  }
   if (!citationId) {
    logger.error(`${LOG_PREFIX} Citation ID is required to generate relationships.`);
    return { success: false, message: "Citation ID is required.", errors: ['Missing citationId'] };
  }
   if (!predictorName) {
        logger.warn(`${LOG_PREFIX} Predictor name not provided for ${predictorGlobalVariableId}, prompts may be less effective.`);
        // Assign a default or use ID if name is critical and missing
        predictorName = predictorGlobalVariableId;
   }

  // --- Step 1: Generate Potential Outcome Variables --- (No DB interaction)
  logger.info(`${LOG_PREFIX} Generating potential outcome variables for ${predictorName}...`);
  let suggestedOutcomeVariables: z.infer<typeof AIOutcomeVariableResponseSchema> = [];

  const outcomePrompt = `Given the intervention (predictor variable) named "${predictorName}", suggest a list of potential outcome variables that might be affected by it. For each suggested outcome variable, provide:
  1. A concise, descriptive 'name'.
  2. An optional 'description' explaining what it measures.
  3. The most appropriate 'variable_category_id' from the following list: ${JSON.stringify(variableCategoryIds)}
  4. The most appropriate 'default_unit_id' from the following list: ${JSON.stringify(unitIds)}

Focus on commonly measured outcomes. Return the list as a JSON array matching the schema.`;

  try {
    const { object: aiOutcomeSuggestions } = await generateObject({
      model: aiModel,
      schema: AIOutcomeVariableResponseSchema,
      prompt: outcomePrompt,
      mode: "json",
      maxRetries: 1,
    });
    suggestedOutcomeVariables = aiOutcomeSuggestions;
    logger.info(`${LOG_PREFIX} AI suggested ${suggestedOutcomeVariables.length} potential outcome variables.`);

  } catch (error) {
    // Error handling remains the same...
    if (NoObjectGeneratedError.isInstance(error)) {
      logger.error(`${LOG_PREFIX} AI failed to generate valid outcome variable suggestions:`, { message: error.message, cause: error.cause, text: error.text });
      errors.push('AI failed to generate outcome suggestions');
    } else {
      logger.error(`${LOG_PREFIX} AI outcome generation call failed unexpectedly:`, { error });
      errors.push('Unexpected AI error during outcome generation');
    }
    return {
      success: false,
      message: "Failed to generate potential outcome variables.",
      errors,
    };
  }


  // --- Step 2: Process Outcome Variables (Prepare for SQL, no DB interaction) ---
  logger.info(`${LOG_PREFIX} Processing ${suggestedOutcomeVariables.length} suggested outcome variables for SQL...`);

  for (const suggestion of suggestedOutcomeVariables) {
    const potentialId = slugify(suggestion.name);
    if (!potentialId) {
      logger.warn(`${LOG_PREFIX} Could not generate valid ID for suggestion: ${suggestion.name}. Skipping.`);
      continue;
    }

    try {
        // Construct the data object for potential insertion
        const newVariableData: GVInsert = {
          id: potentialId,
          name: suggestion.name,
          description: suggestion.description,
          variable_category_id: suggestion.variable_category_id,
          default_unit_id: suggestion.default_unit_id,
          // Ensure all required fields for GVInsert are present or null/default
        };

        // Validate the object (important!)
        const validationResult = publicGlobalVariablesInsertSchemaSchema.safeParse(newVariableData);
        if (!validationResult.success) {
            logger.error(`${LOG_PREFIX} Validation failed for new variable ${potentialId}:`, validationResult.error.flatten());
            errors.push(`Validation error for ${potentialId}: ${validationResult.error.message}`);
            continue; // Skip this suggestion
        }

        // Add the validated data to our collection
        generatedVariables.push(validationResult.data);
        outcomeIdsToRelate.push(potentialId); // Keep track of IDs for relationship prompt
        logger.debug(`${LOG_PREFIX} Prepared variable for SQL: ${potentialId} (${suggestion.name})`);

    } catch (error) {
      logger.error(`${LOG_PREFIX} Unexpected error preparing SQL for suggestion '${suggestion.name}':`, error);
      errors.push(`Unexpected error for ${suggestion.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  logger.info(`${LOG_PREFIX} Prepared ${generatedVariables.length} variables for SQL generation.`);


  // --- Step 3: Generate Relationships (No DB interaction) ---
  let suggestedRelationships: z.infer<typeof AIRelationshipResponseSchema> = [];

  if (outcomeIdsToRelate.length > 0) {
    logger.info(`${LOG_PREFIX} Generating relationship suggestions between predictor ${predictorGlobalVariableId} and ${outcomeIdsToRelate.length} outcomes...`);

    // Construct prompt (remains the same)
    const relationshipPrompt = `Based on the intervention (predictor variable) with ID "${predictorGlobalVariableId}" (named "${predictorName}") and the following potential outcome variable IDs:
${JSON.stringify(outcomeIdsToRelate)}

Suggest potential relationships between the predictor and each outcome variable. Format the response as a JSON array adhering strictly to the provided schema.

**IMPORTANT (DEMO DATA):** You MUST provide plausible values for **ALL** fields in the schema for every relationship. This includes 'category' (choose from ['Efficacy', 'Safety', 'Mechanism', 'Correlation']), best-guess estimates for quantitative values ('percentage_change', 'absolute_change_value', 'absolute_change_unit_id'), 'baseline_description', NNT/NNH ('nnt', 'nnh' - use 9999 if not applicable).`;

    try {
      // Call generateObject (remains the same)
      const { object: aiRelationshipSuggestions } = await generateObject({
        model: aiModel,
        schema: AIRelationshipResponseSchema,
        prompt: relationshipPrompt,
        mode: "json",
        maxRetries: 1,
      });

      // Filter suggestions (remains the same)
      suggestedRelationships = aiRelationshipSuggestions.filter(rel =>
        outcomeIdsToRelate.includes(rel.outcome_global_variable_id)
      );
      if (suggestedRelationships.length !== aiRelationshipSuggestions.length) {
           logger.warn(`${LOG_PREFIX} AI returned relationships for outcome IDs not in the requested list. Filtering them out.`);
      }
      logger.info(`${LOG_PREFIX} AI generated ${suggestedRelationships.length} relationship suggestions.`);

    } catch (error) {
      // Error handling remains the same...
      if (NoObjectGeneratedError.isInstance(error)) {
        logger.error(`${LOG_PREFIX} AI failed to generate valid relationship suggestions:`, { message: error.message, cause: error.cause, text: error.text });
        errors.push('AI failed to generate relationship suggestions');
      } else {
        logger.error(`${LOG_PREFIX} AI relationship generation call failed unexpectedly:`, { error });
        errors.push('Unexpected AI error during relationship generation');
      }
      // Continue without relationships, but log error
    }

  } else {
     logger.warn(`${LOG_PREFIX} No outcome variables prepared. Skipping relationship generation.`);
  }

  // --- Step 4: Prepare Relationship Data for SQL (No DB interaction) ---
  if (suggestedRelationships.length > 0) {
      logger.info(`${LOG_PREFIX} Preparing ${suggestedRelationships.length} generated relationships for SQL...`);

      for (const suggestion of suggestedRelationships) {
        try {
          // Construct the full data object
          const newRelationshipData: RelInsert = {
            ...suggestion,
            predictor_global_variable_id: predictorGlobalVariableId,
            citation_id: citationId,
            // Ensure all required fields for RelInsert are present or null/default
          };

          // Validate the object
          const validationResult = publicGlobalVariableRelationshipsInsertSchemaSchema.safeParse(newRelationshipData);
          if (!validationResult.success) {
            logger.error(`${LOG_PREFIX} Validation failed for relationship (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}):`, validationResult.error.flatten());
            errors.push(`Validation error for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}: ${validationResult.error.message}`);
            continue; // Skip this relationship
          }

          // Add validated data to our collection
          generatedRelationships.push(validationResult.data);
          logger.debug(`${LOG_PREFIX} Prepared relationship for SQL: ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}`);

        } catch (error) {
             logger.error(`${LOG_PREFIX} Unexpected error preparing relationship SQL (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}):`, error);
             errors.push(`Unexpected error for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      logger.info(`${LOG_PREFIX} Finished preparing relationships for SQL. Prepared: ${generatedRelationships.length}`);
  } else {
       logger.info(`${LOG_PREFIX} No relationship suggestions to prepare for SQL.`);
  }


  // --- Final Result --- RETURN DATA
  const generatedData: GeneratedSqlData = {
    newVariables: generatedVariables,
    newRelationships: generatedRelationships,
  };

  if (errors.length > 0) {
    return {
      success: false,
      message: `Generation finished with ${errors.length} error(s). Data may be incomplete.`, // Adjusted message
      data: generatedData, // Still return potentially partial data
      errors,
    };
  }

  logger.info(`${LOG_PREFIX} SQL data generation completed successfully for predictor: ${predictorGlobalVariableId}. Variables: ${generatedVariables.length}, Relationships: ${generatedRelationships.length}`);
  return {
    success: true,
    message: "Successfully generated SQL data for outcomes and relationships.",
    data: generatedData,
  };
}

// Remove example usage or keep it commented
/*
async function runGeneration() {
  // No Supabase needed here if checks removed
  const result = await generateInterventionSqlData(
    'intervention-id-example',
    'Intervention Example Name',
    'placeholder-citation-id'
  );
  console.log(JSON.stringify(result, null, 2));
}
// runGeneration();
*/ 