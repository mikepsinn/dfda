"use server";

import { logger } from "@/lib/logger";
// import { createServerActionClient } from "@supabase/auth-helpers-nextjs"; // Remove old import
import { createClient } from "@/utils/supabase/server"; // Correct import
// import { cookies } from "next/headers"; // No longer needed here
import type { Database } from "@/lib/database.types";
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'; // Import category IDs

// Define the structure for search results, aligning with SearchModal
export interface SearchResult {
  id: string; // Can be global_variable_id or user_variable_id depending on context
  name: string;
  href: string;
  category: "Global Variables" | "My Variables"; // Category for display grouping
  variableCategoryId?: string; // Store the category ID if needed later
}

type GlobalVar = Database["public"]["Tables"]["global_variables"]["Row"];
// Assuming user_variables joins with global_variables to get the name
type UserVarJoin = {
  id: string; // user_variable id
  global_variable_id: string;
  user_id: string;
  global_variables: {
    id: string; // global_variable id
    name: string;
    variable_category_id: string; // Added category ID
  } | null;
};

// Helper function to determine the correct href based on variable category
function getHrefForVariable(id: string, categoryId: string | undefined): string {
  switch (categoryId) {
    case VARIABLE_CATEGORY_IDS.HEALTH_AND_PHYSIOLOGY:
      return `/conditions/${id}`;
    case VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS:
      // This category covers treatments, food, drink, supplements, etc.
      // Mapping all to /treatments/ for now, based on existing routes.
      return `/treatments/${id}`;
    // Add more cases here for other specific category routes if needed
    // e.g., case VARIABLE_CATEGORY_IDS.ACTIVITY_AND_BEHAVIOR: return `/activities/${id}`;
    default:
      logger.warn("getHrefForVariable: Unmapped category ID, using default /variables/ path", { id, categoryId });
      // Fallback for unmapped categories or if categoryId is missing
      return `/variables/${id}`;
  }
}

/**
 * Searches variables based on a query string.
 * Fetches global variables matching the query.
 * If a user is logged in, also fetches their specific variables (user_variables)
 * that match the query, prioritizing them in the results.
 */
export async function searchVariablesAction(
  query: string,
  userId?: string | null
): Promise<SearchResult[]> {
  logger.info("searchVariablesAction: Called", { query, userId });
  // const cookieStore = cookies(); // Removed
  // Use the server client utility, which handles cookies internally
  const supabase = await createClient(); 

  const searchTerm = query.trim();
  let globalResults: SearchResult[] = [];
  let userResults: SearchResult[] = [];
  let userVars: UserVarJoin[] = []; // Initialize as empty array instead of null

  try {
    // Fetch Global Variables matching the query
    // Using ilike for case-insensitive search
    const globalVariablesQuery = supabase
      .from("global_variables")
      .select("id, name, variable_category_id") // Select category ID
      .ilike("name", `%${searchTerm}%`)
      .limit(10); // Limit results

    const { data: globalVars, error: globalError } = await globalVariablesQuery;

    if (globalError) {
      logger.error("searchVariablesAction: Error fetching global variables", { error: globalError });
      // Decide if you want to throw or return partial/empty results
    } else if (globalVars) {
      globalResults = globalVars.map((variable: Pick<GlobalVar, 'id' | 'name' | 'variable_category_id'>) => ({
        id: variable.id,
        name: variable.name,
        // Generate href based on the category ID
        href: getHrefForVariable(variable.id, variable.variable_category_id),
        category: "Global Variables",
        variableCategoryId: variable.variable_category_id,
      }));
    }

    // Fetch User Variables if logged in
    if (userId) {
      const userVariablesQuery = supabase
        .from("user_variables")
        .select(`
          id,
          global_variable_id,
          user_id,
          global_variables!inner( id, name, variable_category_id ) 
        `)
        .eq("user_id", userId)
        .ilike("global_variables.name", `%${searchTerm}%`) // Filter on joined table
        .limit(5);

      const { data: fetchedUserVars, error: userError } = await userVariablesQuery;

      if (userError) {
        logger.error("searchVariablesAction: Error fetching user variables", { error: userError });
      } else if (fetchedUserVars) {
        // Correct type should be inferred now if query is valid
        userVars = fetchedUserVars; 
        userResults = userVars
          .filter((uv): uv is UserVarJoin & { global_variables: NonNullable<UserVarJoin['global_variables']> } => !!uv.global_variables) // Type guard
          .map((userVariable) => ({
            // NOTE: The 'id' here is the user_variable ID, but the link should probably go
            // to the underlying global variable's page. We use the global ID for the href.
            id: userVariable.global_variables.id, // Using global ID for linking consistency
            name: userVariable.global_variables.name,
            // Use the category ID from the joined global_variables
            href: getHrefForVariable(userVariable.global_variables.id, userVariable.global_variables.variable_category_id),
            category: "My Variables", // Display category
            variableCategoryId: userVariable.global_variables.variable_category_id,
          }));
      }
    }

    // Combine results: Prioritize user results, then add global results 
    // ensuring no duplicates based on the underlying global_variable_id
    const combinedResults = [...userResults];
    const userGlobalVarIds = new Set(userVars.map(uv => uv.global_variable_id));
    
    globalResults.forEach(globalResult => {
        // Check if the global variable is already represented by a user variable result
        if (!userGlobalVarIds.has(globalResult.id)) {
            combinedResults.push(globalResult);
        }
    });

    // If the query was empty, we fetched everything, potentially re-sort to prioritize user vars
    if (searchTerm === "" && userId) {
       // Re-sort: User variables first, then global
       combinedResults.sort((a, b) => {
         if (a.category === "My Variables" && b.category !== "My Variables") return -1;
         if (a.category !== "My Variables" && b.category === "My Variables") return 1;
         return a.name.localeCompare(b.name); // Alphabetical within category
       });
    }
    
    // Limit total results if necessary, e.g., top 10 overall
    return combinedResults.slice(0, 10);

  } catch (error) {
    logger.error("searchVariablesAction: Unhandled error", { error });
    return []; // Return empty array on error
  }
} 