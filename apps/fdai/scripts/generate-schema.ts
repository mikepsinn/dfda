import fs from "fs"
import path from "path"
import { getCompleteSchemaSql } from "../lib/sql-loader"

// Define the output path
const outputPath = path.join(process.cwd(), "supabase/schema.sql")

// Generate the header comment
const headerComment = `-- =========================================================
-- AUTOMATICALLY GENERATED FILE - DO NOT EDIT DIRECTLY
-- =========================================================
-- This file is generated from the individual SQL files in:
-- - supabase/sql/schema/
-- - supabase/sql/seed/
--
-- To make changes, edit the source files and run:
-- npm run generate-schema
-- =========================================================

`

// Get the complete SQL from the separate files
const completeSql = getCompleteSchemaSql()

// Combine the header and SQL
const fileContent = headerComment + completeSql

// Write the combined file
fs.writeFileSync(outputPath, fileContent, "utf8")

console.log(`✅ Generated schema.sql (${(fileContent.length / 1024).toFixed(2)} KB)`)
console.log(`📁 Output: ${outputPath}`)
