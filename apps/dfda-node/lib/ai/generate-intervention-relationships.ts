import { z } from 'zod';
import { generateObject, NoObjectGeneratedError } from 'ai';
import { SupabaseClient } from '@supabase/supabase-js'; // Assuming Supabase usage
import { Database } from '@/lib/database.types'; // Import generated types
import { logger } from '@/lib/logger'; // Use logger
import { defaultGoogleModel } from './google'; // Import shared model
import {
  publicGlobalVariablesInsertSchemaSchema,
  publicGlobalVariableRelationshipsInsertSchemaSchema
} from '@/lib/database.schemas'; // Import relevant Zod schemas
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'; // Import category IDs
import { UNIT_IDS } from '@/lib/constants/units'; // Import unit IDs

const aiModel = defaultGoogleModel; // Use the imported default model
const LOG_PREFIX = '[generate-intervention-relationships]';

// --- Zod Enums from Constants ---
const variableCategoryIds = Object.values(VARIABLE_CATEGORY_IDS);
const unitIds = Object.values(UNIT_IDS);

// Check if arrays are empty before creating enums
const VariableCategoryIdEnum = variableCategoryIds.length > 0
  ? z.enum(variableCategoryIds as [string, ...string[]]) // Type assertion for non-empty array
  : z.string(); // Fallback to string if empty

const UnitIdEnum = unitIds.length > 0
  ? z.enum(unitIds as [string, ...string[]]) // Type assertion for non-empty array
  : z.string(); // Fallback to string if empty

// --- Zod Schemas for AI ---

// Updated schema for suggesting new outcome variables
const AISuggestedOutcomeVariableSchema = z.object({
  name: z.string().describe("A concise, descriptive name for the outcome variable (e.g., 'Systolic Blood Pressure', 'HbA1c', 'Subjective Mood Score')."),
  description: z.string().optional().describe("A brief explanation of what the variable measures."),
  variable_category_id: VariableCategoryIdEnum.describe("The most appropriate category ID for this variable."),
  default_unit_id: UnitIdEnum.describe("The most common or standard unit ID used to measure this variable.")
});

const AIOutcomeVariableResponseSchema = z.array(AISuggestedOutcomeVariableSchema);

// Schema for suggesting relationship details (subset of the full insert schema)
// We'll ask the AI to provide fields it can reasonably infer.
const AIRelationshipSuggestionSchema = publicGlobalVariableRelationshipsInsertSchemaSchema.pick({
  outcome_global_variable_id: true, // AI needs to echo back the outcome ID
  category: true, // e.g., "Primary Outcome", "Safety Outcome", "Biomarker"
  // Make nullable fields explicitly optional in the picked schema for AI
  is_positive_outcome: true,
  finding_specific_notes: true,
  // NNT/NNH/Changes are likely too complex for generic AI without data
}).extend({
    // Ensure these are optional even after picking (pick preserves optionality)
    is_positive_outcome: z.boolean().optional().describe("Is the typical desired effect for this outcome positive (true) or negative (false)? Consider the outcome variable itself."),
    finding_specific_notes: z.string().optional().describe("Brief summary of the expected link or effect.")
}).describe("Details about the relationship between the predictor and a specific outcome.");

const AIRelationshipResponseSchema = z.array(AIRelationshipSuggestionSchema);


// --- Main Function ---

interface GenerationResult {
  success: boolean;
  message: string;
  generatedOutcomeIds?: string[];
  generatedRelationshipIds?: string[];
  errors?: any[];
}

// --- Utility Function ---
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/&/g, '-and-')    // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars except -
    .replace(/--+/g, '-');      // Replace multiple - with single -
}

/**
 * Takes an intervention (predictor variable ID), uses AI to suggest affected outcome variables,
 * checks/creates them in the DB, then uses AI again to suggest and create relationships.
 *
 * @param predictorGlobalVariableId The ID of the intervention/predictor global variable.
 * @param supabase The Supabase client instance for database operations.
 * @param citationId A placeholder or real citation ID to associate with the generated relationships.
 * @returns Promise<GenerationResult> An object indicating success/failure and details.
 */
export async function generateAndStoreInterventionRelationships(
  predictorGlobalVariableId: string,
  supabase: SupabaseClient<Database>,
  citationId: string // Required for relationships
): Promise<GenerationResult> {
  logger.info(`${LOG_PREFIX} Starting generation for predictor: ${predictorGlobalVariableId}`);
  const errors: any[] = [];
  const generatedOutcomeIds: string[] = [];
  const generatedRelationshipIds: string[] = [];

  if (!aiModel) {
    logger.error(`${LOG_PREFIX} AI model not configured.`);
    return { success: false, message: "AI model not configured.", errors: ['AI model not available'] };
  }
   if (!citationId) {
    logger.error(`${LOG_PREFIX} Citation ID is required to create relationships.`);
    return { success: false, message: "Citation ID is required.", errors: ['Missing citationId'] };
  }

  // --- TODO: Step 1: Get Predictor Details (Name, Description) ---
  // Fetching the predictor variable details helps create a better prompt for the AI.
  logger.debug(`${LOG_PREFIX} Fetching details for predictor: ${predictorGlobalVariableId}`);
  // const { data: predictorData, error: predictorError } = await supabase
  //   .from('global_variables')
  //   .select('name, description')
  //   .eq('id', predictorGlobalVariableId)
  //   .single();

  // if (predictorError || !predictorData) {
  //   logger.error(`${LOG_PREFIX} Failed to fetch predictor details`, predictorError);
  //   errors.push(predictorError || 'Predictor not found');
  //   // Decide whether to continue without predictor details or fail
  //   // return { success: false, message: "Failed to fetch predictor details.", errors };
  // }
  // const predictorName = predictorData?.name ?? predictorGlobalVariableId;
  // const predictorDescription = predictorData?.description ?? '';
  const predictorName = `Predictor (${predictorGlobalVariableId})`; // Placeholder
  let suggestedOutcomeVariables: z.infer<typeof AIOutcomeVariableResponseSchema> = [];

  // --- Step 2: Generate Potential Outcome Variables ---
  logger.info(`${LOG_PREFIX} Generating potential outcome variables for ${predictorName}...`);

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
    if (NoObjectGeneratedError.isInstance(error)) {
      logger.error(`${LOG_PREFIX} AI failed to generate valid outcome variable suggestions:`, { message: error.message, cause: error.cause, text: error.text });
      errors.push('AI failed to generate outcome suggestions');
    } else {
      logger.error(`${LOG_PREFIX} AI outcome generation call failed unexpectedly:`, { error });
      errors.push('Unexpected AI error during outcome generation');
    }
    // If AI fails here, we cannot proceed meaningfully
    return {
      success: false,
      message: "Failed to generate potential outcome variables.",
      errors,
    };
  }


  // --- Step 3: Process Outcome Variables (Check/Create in DB) ---
  logger.info(`${LOG_PREFIX} Processing ${suggestedOutcomeVariables.length} suggested outcome variables...`);
  const outcomeIdsToRelate: string[] = [];

  for (const suggestion of suggestedOutcomeVariables) {
    const potentialId = slugify(suggestion.name);
    if (!potentialId) {
      logger.warn(`${LOG_PREFIX} Could not generate valid ID for suggestion: ${suggestion.name}. Skipping.`);
      continue;
    }

    try {
      // 3b. Check if variable exists by slugified ID
      logger.debug(`${LOG_PREFIX} Checking for existing variable with ID: ${potentialId}`);
      const { data: existingVar, error: checkError } = await supabase
        .from('global_variables')
        .select('id')
        .eq('id', potentialId)
        .maybeSingle();

      if (checkError) {
        logger.error(`${LOG_PREFIX} Error checking for existing variable ${potentialId}:`, checkError);
        errors.push(`DB check error for ${potentialId}: ${checkError.message}`);
        continue; // Skip this suggestion on error
      }

      if (existingVar) {
        logger.info(`${LOG_PREFIX} Variable '${suggestion.name}' (ID: ${potentialId}) already exists. Using existing.`);
        outcomeIdsToRelate.push(existingVar.id);
        generatedOutcomeIds.push(existingVar.id); // Track existing ones too
      } else {
        // 3c. If not exists, INSERT into global_variables
        logger.info(`${LOG_PREFIX} Variable '${suggestion.name}' (ID: ${potentialId}) does not exist. Creating...`);

        // Prepare and validate the insert object
        const newVariableData: z.infer<typeof publicGlobalVariablesInsertSchemaSchema> = {
          id: potentialId,
          name: suggestion.name,
          description: suggestion.description,
          variable_category_id: suggestion.variable_category_id,
          default_unit_id: suggestion.default_unit_id,
          // Add other required fields if any, or handle potential validation errors
          // emoji: undefined, // Example if needed
          // image_url: undefined, // Example if needed
        };

        // Validate with the schema before inserting
        const validationResult = publicGlobalVariablesInsertSchemaSchema.safeParse(newVariableData);

        if (!validationResult.success) {
            logger.error(`${LOG_PREFIX} Validation failed for new variable ${potentialId}:`, validationResult.error.flatten());
            errors.push(`Validation error for ${potentialId}: ${validationResult.error.message}`);
            continue; // Skip this suggestion
        }

        const { data: insertResult, error: insertError } = await supabase
          .from('global_variables')
          .insert(validationResult.data) // Use validated data
          .select('id')
          .single();

        if (insertError) {
          logger.error(`${LOG_PREFIX} Error inserting new variable ${potentialId}:`, insertError);
          errors.push(`DB insert error for ${potentialId}: ${insertError.message}`);
          continue; // Skip this suggestion
        }

        if (insertResult) {
          logger.info(`${LOG_PREFIX} Successfully created new variable: ${insertResult.id}`);
          outcomeIdsToRelate.push(insertResult.id);
          generatedOutcomeIds.push(insertResult.id);
        } else {
           logger.warn(`${LOG_PREFIX} Insert operation for ${potentialId} did not return an ID.`);
           errors.push(`Insert failed for ${potentialId} (no ID returned)`);
        }
      }
    } catch (error) {
      logger.error(`${LOG_PREFIX} Unexpected error processing suggestion '${suggestion.name}':`, error);
      errors.push(`Unexpected error for ${suggestion.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 3d. Collected all relevant outcome_global_variable_ids in outcomeIdsToRelate
  logger.info(`${LOG_PREFIX} Identified/created ${outcomeIdsToRelate.length} outcome variables for relationship generation.`);


  // --- Step 4: Generate Relationships ---
  let suggestedRelationships: z.infer<typeof AIRelationshipResponseSchema> = [];

  if (outcomeIdsToRelate.length > 0) {
    logger.info(`${LOG_PREFIX} Generating relationship suggestions between predictor ${predictorGlobalVariableId} and ${outcomeIdsToRelate.length} outcomes...`);

    // 4a. Construct prompt providing predictor and outcome IDs
    const relationshipPrompt = `Based on the intervention (predictor variable) with ID "${predictorGlobalVariableId}" (named "${predictorName}") and the following potential outcome variable IDs:
${JSON.stringify(outcomeIdsToRelate)}

For each outcome ID, suggest a potential relationship, providing:
1. The 'outcome_global_variable_id' (echoing back the ID from the list above).
2. A 'category' for the relationship (e.g., "Primary Efficacy", "Secondary Efficacy", "Safety/Side Effect", "Biomarker Change", "Mechanism Link").
3. Whether the typical *desired* effect for this outcome is positive ('is_positive_outcome' = true, e.g., lower blood pressure is good) or negative ('is_positive_outcome' = false, e.g., lower mood score is bad). Consider the outcome variable itself, not necessarily the effect of the predictor.
4. A brief summary of the *expected* link or effect in 'finding_specific_notes' (e.g., "Expected to lower systolic blood pressure", "May increase risk of nausea", "Correlated with improved mood scores").

Return the list as a JSON array matching the schema. Only include suggestions for the provided outcome IDs.`;

    try {
      // 4b. Call generateObject with AIRelationshipResponseSchema
      const { object: aiRelationshipSuggestions } = await generateObject({
        model: aiModel,
        schema: AIRelationshipResponseSchema,
        prompt: relationshipPrompt,
        mode: "json",
        maxRetries: 1,
      });

      // 4c. Basic validation: Ensure AI returned suggestions only for requested outcome IDs
      suggestedRelationships = aiRelationshipSuggestions.filter(rel =>
        outcomeIdsToRelate.includes(rel.outcome_global_variable_id)
      );

      if (suggestedRelationships.length !== aiRelationshipSuggestions.length) {
           logger.warn(`${LOG_PREFIX} AI returned relationships for outcome IDs not in the requested list. Filtering them out.`);
           // Potentially add to errors if this is unexpected
      }

      logger.info(`${LOG_PREFIX} AI generated ${suggestedRelationships.length} relationship suggestions.`);

    } catch (error) {
      // 4d. Handle errors
      if (NoObjectGeneratedError.isInstance(error)) {
        logger.error(`${LOG_PREFIX} AI failed to generate valid relationship suggestions:`, { message: error.message, cause: error.cause, text: error.text });
        errors.push('AI failed to generate relationship suggestions');
      } else {
        logger.error(`${LOG_PREFIX} AI relationship generation call failed unexpectedly:`, { error });
        errors.push('Unexpected AI error during relationship generation');
      }
      // Proceeding without relationships might be acceptable, so we don't return failure here, just log errors.
      // If relationships are critical, we could add a check here and return failure.
    }

  } else {
     logger.warn(`${LOG_PREFIX} No outcome variables identified or created. Skipping relationship generation.`);
  }

  // --- Step 5: Insert Relationships into DB ---
  if (suggestedRelationships.length > 0) {
      logger.info(`${LOG_PREFIX} Storing ${suggestedRelationships.length} generated relationship suggestions...`);

      for (const suggestion of suggestedRelationships) {
        try {
          // 5b. Construct and validate the full insert object
          const newRelationshipData = {
            ...suggestion, // Contains outcome_global_variable_id, category, is_positive_outcome, finding_specific_notes
            predictor_global_variable_id: predictorGlobalVariableId,
            citation_id: citationId,
            // Add defaults for other required fields if necessary & not provided by AI
            // Example: category is required by DB schema and was requested from AI
          };

          const validationResult = publicGlobalVariableRelationshipsInsertSchemaSchema.safeParse(newRelationshipData);

          if (!validationResult.success) {
            logger.error(`${LOG_PREFIX} Validation failed for relationship (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}):`, validationResult.error.flatten());
            errors.push(`Validation error for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}: ${validationResult.error.message}`);
            continue; // Skip this relationship
          }

          // 5d. INSERT into global_variable_relationships table
          const { data: insertResult, error: insertError } = await supabase
            .from('global_variable_relationships')
            .insert(validationResult.data) // Use validated data
            .select('id')
            .single();

          if (insertError) {
            // Handle potential unique constraint violations gracefully (e.g., if this exact relationship already exists)
            if (insertError.code === '23505') { // Postgres unique violation code
                 logger.warn(`${LOG_PREFIX} Relationship (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}) likely already exists with citation ${citationId}. Skipping insertion.`);
            } else {
                logger.error(`${LOG_PREFIX} Error inserting relationship (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}):`, insertError);
                errors.push(`DB insert error for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}: ${insertError.message}`);
            }
            continue; // Skip this relationship on error
          }

          if (insertResult) {
            logger.info(`${LOG_PREFIX} Successfully created relationship: ${insertResult.id} (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id})`);
            generatedRelationshipIds.push(insertResult.id);
          } else {
            logger.warn(`${LOG_PREFIX} Insert operation for relationship (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}) did not return an ID.`);
            errors.push(`Insert failed for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id} (no ID returned)`);
          }

        } catch (error) {
             logger.error(`${LOG_PREFIX} Unexpected error processing relationship suggestion (${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}):`, error);
             errors.push(`Unexpected error for relationship ${predictorGlobalVariableId} -> ${suggestion.outcome_global_variable_id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      logger.info(`${LOG_PREFIX} Finished storing relationships. Stored: ${generatedRelationshipIds.length}`);
  } else {
       logger.info(`${LOG_PREFIX} No relationship suggestions to store.`);
  }


  // --- Final Result ---
  if (errors.length > 0) {
    return {
      success: false,
      message: `Generation failed with ${errors.length} error(s).`,
      generatedOutcomeIds,
      generatedRelationshipIds,
      errors,
    };
  }

  logger.info(`${LOG_PREFIX} Generation completed successfully for predictor: ${predictorGlobalVariableId}. Outcomes: ${generatedOutcomeIds.length}, Relationships: ${generatedRelationshipIds.length}`);
  return {
    success: true,
    message: "Successfully generated outcomes and relationships.",
    generatedOutcomeIds,
    generatedRelationshipIds,
  };
}

// Example Usage (Conceptual - would be called from elsewhere)
/*
import { createClient } from '@supabase/supabase-js';

async function runGeneration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const result = await generateAndStoreInterventionRelationships(
    'intervention-id-example', // e.g., 'atorvastatin-20mg'
    supabase,
    'placeholder-citation-id' // Needs a valid citation ID
  );

  console.log(result);
}

// runGeneration();
*/ 