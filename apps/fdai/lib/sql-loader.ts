import fs from "fs"
import path from "path"

/**
 * Loads SQL from files using the API
 * @param filePaths Array of paths to SQL files relative to the project root
 * @returns The SQL contents as an object
 */
export async function loadSqlFiles(filePaths: string[]): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: filePaths }),
    })

    if (!response.ok) {
      throw new Error('Failed to load SQL files')
    }

    const data = await response.json()
    return data.files.reduce((acc: Record<string, string>, file: any) => {
      if (file.content) {
        acc[file.path] = file.content
      }
      return acc
    }, {})
  } catch (error) {
    console.error('Error loading SQL files:', error)
    return {}
  }
}

/**
 * Gets the complete schema SQL
 * @returns The complete schema SQL as a string
 */
export async function getCompleteSchemaSql(): Promise<string> {
  const files = [
    "supabase/sql/schema/tables.sql",
    "supabase/sql/schema/treatment-tables.sql",
    "supabase/sql/schema/functions.sql",
    "supabase/sql/seed/reference-data.sql",
    "supabase/sql/seed/condition-data.sql",
    "supabase/sql/seed/symptom-data.sql",
    "supabase/sql/seed/food-data.sql",
    "supabase/sql/seed/treatment-data.sql",
  ]
  const contents = await loadSqlFiles(files)
  return Object.entries(contents)
    .map(([path, content]) => `-- File: ${path}\n${content}`)
    .join('\n\n')
}

/**
 * Gets just the tables SQL
 * @returns The tables SQL as a string
 */
export async function getTablesSql(): Promise<string> {
  const files = ["supabase/sql/schema/tables.sql", "supabase/sql/schema/treatment-tables.sql"]
  const contents = await loadSqlFiles(files)
  return Object.values(contents).join('\n\n')
}

/**
 * Gets just the functions SQL
 * @returns The functions SQL as a string
 */
export async function getFunctionsSql(): Promise<string> {
  const contents = await loadSqlFiles(["supabase/sql/schema/functions.sql"])
  return Object.values(contents)[0] || ''
}

/**
 * Gets the reference data SQL
 * @returns The reference data SQL as a string
 */
export async function getReferenceDataSql(): Promise<string> {
  const contents = await loadSqlFiles(["supabase/sql/seed/reference-data.sql"])
  return Object.values(contents)[0] || ''
}

/**
 * Gets the sample data SQL
 * @returns The sample data SQL as a string
 */
export async function getSampleDataSql(): Promise<string> {
  const files = [
    "supabase/sql/seed/condition-data.sql",
    "supabase/sql/seed/symptom-data.sql",
    "supabase/sql/seed/food-data.sql",
    "supabase/sql/seed/treatment-data.sql",
  ]
  const contents = await loadSqlFiles(files)
  return Object.values(contents).join('\n\n')
}
