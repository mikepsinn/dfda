import fs from "fs"
import path from "path"

/**
 * Loads SQL from a file
 * @param filePath Path to the SQL file relative to the project root
 * @returns The SQL as a string
 */
export function loadSql(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    return fs.readFileSync(fullPath, "utf8")
  } catch (error) {
    console.error(`Error loading SQL file ${filePath}:`, error)
    return ""
  }
}

/**
 * Loads and combines multiple SQL files
 * @param filePaths Array of paths to SQL files relative to the project root
 * @returns The combined SQL as a string
 */
export function loadMultipleSql(filePaths: string[]): string {
  return filePaths
    .map((filePath) => {
      const sql = loadSql(filePath)
      return sql ? `-- File: ${filePath}\n${sql}\n` : ""
    })
    .join("\n")
}

/**
 * Gets the complete schema SQL
 * @returns The complete schema SQL as a string
 */
export function getCompleteSchemaSql(): string {
  return loadMultipleSql([
    "supabase/sql/schema/tables.sql",
    "supabase/sql/schema/treatment-tables.sql",
    "supabase/sql/schema/functions.sql",
    "supabase/sql/seed/reference-data.sql",
    "supabase/sql/seed/condition-data.sql",
    "supabase/sql/seed/symptom-data.sql",
    "supabase/sql/seed/food-data.sql",
    "supabase/sql/seed/treatment-data.sql",
  ])
}

/**
 * Gets just the tables SQL
 * @returns The tables SQL as a string
 */
export function getTablesSql(): string {
  return loadMultipleSql(["supabase/sql/schema/tables.sql", "supabase/sql/schema/treatment-tables.sql"])
}

/**
 * Gets just the functions SQL
 * @returns The functions SQL as a string
 */
export function getFunctionsSql(): string {
  return loadSql("supabase/sql/schema/functions.sql")
}

/**
 * Gets the reference data SQL
 * @returns The reference data SQL as a string
 */
export function getReferenceDataSql(): string {
  return loadSql("supabase/sql/seed/reference-data.sql")
}

/**
 * Gets the sample data SQL
 * @returns The sample data SQL as a string
 */
export function getSampleDataSql(): string {
  return loadMultipleSql([
    "supabase/sql/seed/condition-data.sql",
    "supabase/sql/seed/symptom-data.sql",
    "supabase/sql/seed/food-data.sql",
    "supabase/sql/seed/treatment-data.sql",
  ])
}
