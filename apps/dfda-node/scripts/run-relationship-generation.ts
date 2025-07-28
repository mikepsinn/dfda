import dotenv from 'dotenv';
import path from 'path';
// Load .env file FIRST, before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import fs from 'fs'; // Import Node.js file system module
import crypto from 'crypto'; // For generating citation IDs from URLs
import { createClient } from '@supabase/supabase-js'; // Keep for fetching initial predictors
import {
  generateInterventionSqlData, // Import the renamed function
  // type GeneratedSqlData // Optional: Import type if needed elsewhere
} from '../lib/ai/generate-intervention-relationships';
import { getGroundedAnswerAction } from '../lib/actions/google-grounded-search'; // Import the grounding action
import { logger } from '@/lib/logger';
import { Database } from '@/lib/database.types';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories';
import { GOOGLE_AI_MODEL } from '../lib/ai/google';

const LOG_PREFIX = '[run-relationship-generation]';

// Define types for Insert objects (can also be imported from generate script)
type GVInsert = Database['public']['Tables']['global_variables']['Insert'];
type RelInsert = Database['public']['Tables']['global_variable_relationships']['Insert'];
type CitationInsert = Database['public']['Tables']['citations']['Insert'];


// --- Define AI Model Citation Details ---
const aiModelName = GOOGLE_AI_MODEL;
const aiCitationId = `cite-${aiModelName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
const aiCitationTitle = `AI Generated Relationships (${aiModelName})`;
const aiCitationPublisher = 'Google AI';

// --- SQL Formatting Helper ---
function generateSqlInsert(tableName: string, data: Record<string, any>[], onConflict?: string): string {
  if (!Array.isArray(data) || data.length === 0) return '';

  // Filter out rows where critical columns (like ID) might be missing/invalid if necessary
  // For simplicity, assume data is pre-validated
  const validData = data.filter(row => row && typeof row === 'object');
  if (validData.length === 0) return '';

  const columns = Object.keys(validData[0]).map(col => `"${col}"`).join(', '); // Quote column names
  const valuesList = validData.map(row => {
    const rowValues = Object.keys(validData[0]).map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
      if (typeof val === 'boolean') return String(val).toUpperCase();
      if (typeof val === 'number') return String(val);
      // Basic JSON stringify for arrays/objects - ensure DB column type supports JSON(B)
      if (Array.isArray(val) || typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return String(val); // Fallback for other types
    });
    return `(${rowValues.join(', ')})`;
  });

  const conflictClause = onConflict ? `\n${onConflict}` : '';

  return `-- Insert data into public.${tableName}
INSERT INTO public."${tableName}" (${columns})
VALUES
  ${valuesList.join(',\n  ')}${conflictClause};

`;
}

// --- Helper to create Citation ID from URL ---
function createCitationIdFromUrl(url: string): string {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    return `webcite-${hash.substring(0, 16)}`; // Use first 16 chars of hash
}


async function main() {
  logger.info(`${LOG_PREFIX} Using Citation ID for AI Model: ${aiCitationId} (${aiModelName})`);
  logger.info(`${LOG_PREFIX} Generating SQL seed file for ALL '${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS}' variables, including grounded citations.`);

  // --- Initialize Supabase Client (ONLY for fetching predictors) ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use anon key as we only need read access for predictors
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error(`${LOG_PREFIX} Supabase URL or Anon Key is not configured for fetching predictors.`);
    process.exit(1);
  }
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
     auth: { persistSession: false }
  });

  // --- Fetch Intervention Variables --- (Keep this part)
  logger.info(`${LOG_PREFIX} Fetching variables from category: ${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS}...`);
  const { data: interventionVariables, error: fetchError } = await supabase
    .from('global_variables')
    .select('id, name')
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

  // --- Run Generation and Collect Data ---
  let overallSuccess = true;
  const allNewVariables: GVInsert[] = [];
  const allNewRelationships: RelInsert[] = [];
  const webCitationsMap = new Map<string, CitationInsert>(); // Use Map for unique URLs

  for (const variable of interventionVariables) {
      logger.info(`${LOG_PREFIX} Processing predictor: ${variable.name} (ID: ${variable.id})...`);
      try {
          // Call the modified function
          const result = await generateInterventionSqlData(
              variable.id,
              variable.name, // Pass the fetched name
              aiCitationId
          );

          if (!result.success) {
              overallSuccess = false;
              logger.error(`${LOG_PREFIX} Failed relationship/outcome generation for predictor: ${variable.id}`);
              if(result.errors) {
                  logger.error(`${LOG_PREFIX} Errors: ${JSON.stringify(result.errors)}`);
              }
          }
          // Collect data even if there were non-critical errors during generation
          if (result.data) {
              allNewVariables.push(...result.data.newVariables);
              allNewRelationships.push(...result.data.newRelationships);
              logger.info(`${LOG_PREFIX} Collected structured data for predictor: ${variable.id} (Variables: ${result.data.newVariables.length}, Relations: ${result.data.newRelationships.length})`);
          } else {
              logger.warn(`${LOG_PREFIX} No structured data returned for predictor: ${variable.id}`);
          }

      } catch (error) {
          logger.error(`${LOG_PREFIX} Critical script error during structured generation for predictor ${variable.id}:`, error);
          overallSuccess = false;
      }

      // 2. Get Grounded Citations
      logger.info(`${LOG_PREFIX} Fetching grounded citations for: ${variable.name}...`);
      try {
          const groundedResult = await getGroundedAnswerAction(variable.name);
          if (groundedResult && groundedResult.citations.length > 0) {
              logger.info(`${LOG_PREFIX} Found ${groundedResult.citations.length} web citations for ${variable.name}.`);
              groundedResult.citations.forEach(cite => {
                  if (!webCitationsMap.has(cite.url)) { // Only add if URL is unique
                      const webCitationId = createCitationIdFromUrl(cite.url);
                      const webCitationData: CitationInsert = {
                          id: webCitationId,
                          type: 'webpage', // Use existing valid type
                          title: cite.title || `Web Source for ${variable.name}`,
                          url: cite.url,
                          retrieved_at: new Date().toISOString(),
                          // Optional: Extract domain for publisher?
                          // journal_or_publisher: new URL(cite.url).hostname,
                      };
                      webCitationsMap.set(cite.url, webCitationData);
                  }
              });
          } else {
              logger.warn(`${LOG_PREFIX} No web citations returned by grounding for ${variable.name}.`);
          }
      } catch (error) {
           logger.error(`${LOG_PREFIX} Error fetching grounded citations for ${variable.name}:`, error);
           // Don't necessarily mark overall run as failed for this, but log it
      }
  }

  // --- Deduplicate Variables ---
  const uniqueVariablesMap = new Map<string, GVInsert>();
  allNewVariables.forEach(variable => {
      if (variable.id && !uniqueVariablesMap.has(variable.id)) { // Ensure ID exists before adding
          uniqueVariablesMap.set(variable.id, variable);
      }
  });
  const uniqueNewVariables = Array.from(uniqueVariablesMap.values());
  logger.info(`${LOG_PREFIX} Total unique new/referenced outcome variables prepared for SQL: ${uniqueNewVariables.length}`);

  // --- Prepare AI Model Citation Data ---
  const aiModelCitationData: CitationInsert = {
      id: aiCitationId,
      type: 'other',
      title: aiCitationTitle,
      journal_or_publisher: aiCitationPublisher,
      publication_year: new Date().getFullYear(),
      retrieved_at: new Date().toISOString(),
  };

  // --- Prepare Web Citation Data --- 
  const uniqueWebCitations = Array.from(webCitationsMap.values());
  logger.info(`${LOG_PREFIX} Total unique web citations prepared for SQL: ${uniqueWebCitations.length}`);

  // --- Generate SQL Strings ---
  logger.info(`${LOG_PREFIX} Generating SQL strings...`);
  let sqlString = `-- AI Generated Relationships and Citations Seed File --\n`;
  sqlString += `-- Generated on: ${new Date().toISOString()} --\n`;
  sqlString += `-- Predictor Category: ${VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS} --\n`;
  sqlString += `-- AI Structure Model: ${aiModelName} --\n`;
  // sqlString += `-- AI Grounding Model: ${MODEL_ID} --\n\n`; // Removed log for unavailable constant

  sqlString += generateSqlInsert('citations', [aiModelCitationData], 'ON CONFLICT (id) DO NOTHING');
  // Add web citations
  sqlString += generateSqlInsert('citations', uniqueWebCitations, 'ON CONFLICT (id) DO NOTHING'); 
  sqlString += generateSqlInsert('global_variables', uniqueNewVariables, 'ON CONFLICT (id) DO NOTHING');
  sqlString += generateSqlInsert('global_variable_relationships', allNewRelationships); 

  // --- Write SQL File ---
  const outputPath = path.resolve(process.cwd(), 'supabase', 'seeds', '99_ai_generated_relationships.sql');
  logger.info(`${LOG_PREFIX} Writing SQL seed file to: ${outputPath}`);
  try {
    fs.writeFileSync(outputPath, sqlString);
    logger.info(`${LOG_PREFIX} Successfully wrote SQL seed file.`);
  } catch (error) {
    logger.error(`${LOG_PREFIX} Failed to write SQL seed file:`, error);
    process.exit(1);
  }

  // --- Final Summary ---
  logger.info("-----------------------------------------------------");
  logger.info(`${LOG_PREFIX} SQL Generation Summary:`);
  logger.info(`Processed ${interventionVariables.length} predictors.`);
  logger.info(`Generated SQL for ${uniqueNewVariables.length} unique variables.`);
  logger.info(`Generated SQL for ${allNewRelationships.length} relationships (linked to ${aiCitationId}).`);
  logger.info(`Generated SQL for ${uniqueWebCitations.length} unique web citations.`);
  logger.info(`SQL file saved to: ${outputPath}`);
  logger.info("-----------------------------------------------------");

  if (overallSuccess) {
      logger.info(`${LOG_PREFIX} Script completed successfully.`);
      process.exit(0);
  } else {
      logger.error(`${LOG_PREFIX} Script completed with structured generation errors. SQL file may be incomplete. Check logs.`);
      process.exit(1); // Exit with error code if any structured generation step failed
  }
}

main(); 