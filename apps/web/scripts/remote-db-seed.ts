import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs/promises'; // Add fs promises
import { Client as PgClient } from 'pg'; // Add pg client import

// --- Load Environment Variables ---
// Load from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL; // Use DATABASE_URL for seeding
const seedDir = 'supabase/seeds'; // Define seed directory path

// --- Utility to Apply Seed Data using pg ---
// Extracted from remote-db-migrate.ts
async function applyRemoteSeed() {
  console.log(`
--- Applying Remote Database Seeds from ${seedDir} ---`);

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set.');
    console.error('This is required to connect to the remote database for seeding.');
    throw new Error('Missing DATABASE_URL for seeding.');
  }

  const resolvedSeedDirPath = path.resolve(process.cwd(), seedDir);
  let seedFiles: string[] = [];

  try {
    // Check if seed directory exists and get SQL files
    await fs.access(resolvedSeedDirPath);
    const allFiles = await fs.readdir(resolvedSeedDirPath);
    seedFiles = allFiles
      .filter(file => file.toLowerCase().endsWith('.sql'))
      .sort(); // Sort alphabetically/numerically

    if (seedFiles.length === 0) {
      console.log(`
--- No .sql files found in "${seedDir}". Skipping seeding. ---`);
      return;
    }

    console.log(`Found seed files to execute: ${seedFiles.join(', ')}`);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`
--- Warning: Seed directory "${seedDir}" not found. Skipping seeding. ---`);
      return; // Exit gracefully if seed directory doesn't exist
    } else {
      console.error(`
--- Error accessing seed directory "${seedDir}":`, error.message || error);
      throw error; // Re-throw other access errors
    }
  }

  // Connect to the database once for all seed files
  const client = new PgClient({ connectionString: databaseUrl });
  try {
    console.log('Connecting to remote database for seeding...');
    await client.connect();
    await client.query('BEGIN'); // Start transaction

    for (const seedFile of seedFiles) {
      const fullSeedPath = path.join(resolvedSeedDirPath, seedFile);
      console.log(` --- Executing seed file: ${seedFile} ---`);
      try {
        const sql = await fs.readFile(fullSeedPath, 'utf8');
        await client.query(sql); // Execute SQL within transaction
        console.log(`    Successfully executed: ${seedFile}`);
      } catch (error: any) {
        console.error(`    Error executing seed file "${seedFile}":`, error.message || error);
        // Rethrow AFTER rollback
        throw new Error(`Failed to execute seed file: ${seedFile}`);
      }
    }

    await client.query('COMMIT'); // Commit transaction if all files succeed
    console.log(`
--- Completed: Remote Database Seeding ---`);

  } catch (error: any) {
    // Attempt to rollback if connection was established
    if (client && client.database) { // Check if client connected before trying rollback
      try {
        console.error('>>> Error during seeding, attempting ROLLBACK...');
        await client.query('ROLLBACK');
        console.error('>>> ROLLBACK successful.');
      } catch (rollbackError: any) {
        console.error('>>> ROLLBACK failed:', rollbackError.message || rollbackError);
      }
    }
    // Log original error and re-throw
    console.error(`
--- Error during remote database seeding process:`, error.message || error);
    throw error;

  } finally {
    // Ensure client connection is always closed
    if (client) {
        await client.end();
        console.log('Database connection closed after seeding.');
    }
  }
}


// --- Main Execution Function ---
async function runSeeding() {
  console.log('🚀 Starting Remote Database Seeding...');
  try {
    await applyRemoteSeed();
    console.log(`
Database seeding completed successfully!
`);
  } catch (error) {
    console.error(`
Database seeding failed!
Error: ${error instanceof Error ? error.message : String(error)}
`);
    process.exit(1); // Exit with error code
  }
}

// --- Run the seeding ---
runSeeding(); 