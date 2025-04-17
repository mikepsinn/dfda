import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
// import minimist from 'minimist'; // No longer needed
import { generateAndStoreInterventionRelationships } from '../lib/ai/generate-intervention-relationships';
import { logger } from '@/lib/logger';
import { Database } from '@/lib/database.types';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'; // Import category IDs
import { GOOGLE_AI_MODEL } from '../lib/ai/google'; // Import AI model name

const LOG_PREFIX = '[run-relationship-generation]';

// --- Define AI Model Citation --- 
const aiModelName = GOOGLE_AI_MODEL;
// Generate citation ID from model name (replace slashes/dots, add prefix)
const aiCitationId = `cite-${aiModelName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
const aiCitationTitle = `AI Generated Relationships (${aiModelName})`;
const aiCitationPublisher = 'Google AI';

async function main() {
  // const args = minimist(process.argv.slice(2)); // No longer needed
  // const citationId = args.citation || args.c; // No longer needed

  // Log the citation being used
  logger.info(`${LOG_PREFIX} Using Citation ID: ${aiCitationId} (for AI model: ${aiModelName})`);
  logger.info(`${LOG_PREFIX} Starting relationship generation for ALL '${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS}' variables.`);

  // --- Initialize Supabase Client ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    logger.error(`${LOG_PREFIX} Supabase URL or Service Role Key is not configured.`);
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
     auth: { persistSession: false }
  });

  // --- Ensure AI Model Citation Exists ---
  logger.info(`${LOG_PREFIX} Ensuring citation record exists for ID: ${aiCitationId}...`);
  const { error: citationInsertError } = await supabase
      .from('citations')
      .insert({
          id: aiCitationId,
          type: 'other',
          title: aiCitationTitle,
          journal_or_publisher: aiCitationPublisher,
          publication_year: new Date().getFullYear(),
          retrieved_at: new Date().toISOString(),
          // Other fields like aggregate counts are null by default
      })
      // If the citation already exists, do nothing
      .select()
      .maybeSingle(); // Use maybeSingle to handle potential conflict without error

  // We don't strictly need to check the error if conflict is expected/handled,
  // but log if something else goes wrong.
  if (citationInsertError && citationInsertError.code !== '23505' /* unique_violation */ ) {
     logger.error(`${LOG_PREFIX} Error inserting/checking AI citation ${aiCitationId}:`, citationInsertError);
     // Decide if this is critical; maybe proceed anyway?
     // process.exit(1); 
  } else {
      logger.info(`${LOG_PREFIX} Citation record OK.`);
  }

  // --- Fetch Intervention Variables ---
  logger.info(`${LOG_PREFIX} Fetching variables from category: ${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS}...`);
  const { data: interventionVariables, error: fetchError } = await supabase
    .from('global_variables')
    .select('id, name') // Select name for logging
    .eq('variable_category_id', VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS);

  if (fetchError) {
      logger.error(`${LOG_PREFIX} Failed to fetch intervention variables:`, fetchError);
      process.exit(1);
  }

  if (!interventionVariables || interventionVariables.length === 0) {
      logger.warn(`${LOG_PREFIX} No variables found in category ${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS}. Exiting.`);
      process.exit(0);
  }

  logger.info(`${LOG_PREFIX} Found ${interventionVariables.length} intervention variables to process.`);

  // --- Run the Generation Function for each variable ---
  let overallSuccess = true;
  const results: { predictorId: string, result: any }[] = [];

  for (const variable of interventionVariables) {
      logger.info(`${LOG_PREFIX} Processing predictor: ${variable.name} (ID: ${variable.id})...`);
      try {
          const result = await generateAndStoreInterventionRelationships(
              variable.id,
              supabase,
              aiCitationId // Use the automatically generated citation ID
          );
          results.push({ predictorId: variable.id, result });
          if (!result.success) {
              overallSuccess = false;
              logger.error(`${LOG_PREFIX} Failed generation for predictor: ${variable.id}`);
              // Log specific errors from result.errors if needed
              if(result.errors) {
                  logger.error(`${LOG_PREFIX} Errors: ${JSON.stringify(result.errors)}`);
              }
          } else {
               logger.info(`${LOG_PREFIX} Successfully generated relationships for predictor: ${variable.id}`);
          }
      } catch (error) {
          logger.error(`${LOG_PREFIX} Critical error during generation for predictor ${variable.id}:`, error);
          overallSuccess = false;
          results.push({ predictorId: variable.id, result: { success: false, message: "Script error", errors: [error instanceof Error ? error.message : String(error)] } });
      }
      // Optional: Add a delay here if needed to avoid rate limits
      // await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // --- Final Summary ---
  logger.info("-----------------------------------------------------");
  logger.info(`${LOG_PREFIX} Relationship Generation Summary:`);
  logger.info(`Processed ${interventionVariables.length} predictors.`);
  logger.info(`Citation ID used: ${aiCitationId}`); // Log the AI citation ID used

  const successfulRuns = results.filter(r => r.result.success).length;
  const failedRuns = results.length - successfulRuns;

  logger.info(`Successful runs: ${successfulRuns}`);
  logger.info(`Failed runs: ${failedRuns}`);
  logger.info("-----------------------------------------------------");

  if (overallSuccess) {
      logger.info(`${LOG_PREFIX} All generation tasks completed successfully.`);
      process.exit(0);
  } else {
      logger.error(`${LOG_PREFIX} Some generation tasks failed. Check logs above for details.`);
      process.exit(1);
  }
}

main(); 