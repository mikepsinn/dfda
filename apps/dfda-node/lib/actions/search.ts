"use server";

import { logger } from "@/lib/logger";
// import { createServerActionClient } from "@supabase/auth-helpers-nextjs"; // Remove old import
import { createClient } from "@/utils/supabase/server"; // Correct import
// import { cookies } from "next/headers"; // No longer needed here
import type { Database } from "@/lib/database.types";

// Define the structure for search results, aligning with SearchModal
export interface SearchResult {
  id: string;
  name: string;
  href: string;
  category: "Global Variables" | "My Variables";
}

type GlobalVar = Database["public"]["Tables"]["global_variables"]["Row"];
// Assuming user_variables joins with global_variables to get the name
type UserVarJoin = {
  id: string; // user_variable id
  global_variable_id: string;
  user_id: string;
  global_variables: {
    id: string;
    name: string;
    // Include other necessary fields from global_variables if needed for the link
  } | null;
};

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
      .select("id, name") // Select only needed fields
      .ilike("name", `%${searchTerm}%`)
      .limit(10); // Limit results

    const { data: globalVars, error: globalError } = await globalVariablesQuery;

    if (globalError) {
      logger.error("searchVariablesAction: Error fetching global variables", { error: globalError });
      // Decide if you want to throw or return partial/empty results
    } else if (globalVars) {
      globalResults = globalVars.map((variable: Pick<GlobalVar, 'id' | 'name'>) => ({
        id: variable.id,
        name: variable.name,
        // TODO: Determine the correct href structure, maybe based on a slug?
        href: `/variables/${variable.id}`, // Placeholder href
        category: "Global Variables",
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
          global_variables ( id, name )
        `)
        .eq("user_id", userId)
        .ilike("global_variables.name", `%${searchTerm}%`)
        .limit(5);

      const { data: fetchedUserVars, error: userError } = await userVariablesQuery;

      if (userError) {
        logger.error("searchVariablesAction: Error fetching user variables", { error: userError });
      } else if (fetchedUserVars) {
        userVars = fetchedUserVars;
        userResults = userVars
          .filter((uv) => uv.global_variables)
          .map((userVariable) => ({
            id: userVariable.id,
            name: userVariable.global_variables!.name,
            href: `/patient/user-variables/${userVariable.id}`,
            category: "My Variables",
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