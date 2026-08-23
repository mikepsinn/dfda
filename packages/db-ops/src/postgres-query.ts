#!/usr/bin/env tsx

/**
 * PostgreSQL Query CLI Tool
 *
 * Usage:
 *   # Interactive mode (REPL)
 *   pnpm postgres
 *   tsx src/postgres-query.ts
 *
 *   # Execute a single query
 *   pnpm postgres "SELECT * FROM users LIMIT 5"
 *   tsx src/postgres-query.ts "SELECT * FROM users LIMIT 5"
 *
 *   # Another example
 *   pnpm pg "SELECT version()"
 *
 * Environment Variables:
 *   DATABASE_URL or POSTGRES_DATABASE_URL - PostgreSQL connection URL (required)
 *   Format: postgresql://user:password@host:port/database
 */

import { Pool, QueryResult } from 'pg';
import * as readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from package directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const POSTGRES_URL = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  console.error('Error: DATABASE_URL or POSTGRES_DATABASE_URL environment variable is required');
  console.error('Format: postgresql://user:password@host:port/database');
  process.exit(1);
}
const POSTGRES_DATABASE_URL = POSTGRES_URL;

function getErrorDetails(error: unknown): { message: string; position?: string } {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error) };
  }

  const candidate = error as { message?: unknown; position?: unknown };
  return {
    message: typeof candidate.message === 'string' ? candidate.message : String(error),
    position: typeof candidate.position === 'string' ? candidate.position : undefined,
  };
}

async function executeQuery(pool: Pool, query: string): Promise<boolean> {
  try {
    const startTime = Date.now();
    const result: QueryResult = await pool.query(query);
    const duration = Date.now() - startTime;

    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 Results:');
      console.table(result.rows);
      console.log(`\n✓ ${result.rowCount} row(s) returned in ${duration}ms`);
    } else if (result.command === 'SELECT') {
      console.log('\n✓ Query returned 0 rows');
      console.log(`⏱️  ${duration}ms`);
    } else {
      console.log('\n✓ Query executed successfully');
      console.log(`Command: ${result.command}`);
      if (result.rowCount !== null) {
        console.log(`Rows affected: ${result.rowCount}`);
      }
      console.log(`⏱️  ${duration}ms`);
    }
    return true;
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    console.error('\n✗ Query failed:', details.message);
    if (details.position) {
      console.error(`Position: ${details.position}`);
    }
    return false;
  }
}

async function runInteractive(pool: Pool) {
  console.log('\n🔍 PostgreSQL Interactive Query Tool');
  console.log('Connected to:', POSTGRES_DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('\nCommands:');
  console.log('  - Type SQL queries and press Enter');
  console.log('  - Type .exit or .quit to exit');
  console.log('  - Type .tables to show all tables');
  console.log('  - Type .help for more commands');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'postgres> ',
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    rl.pause();

    try {
      const input = line.trim();

      if (!input) return;

      // Handle special commands
      if (input === '.exit' || input === '.quit') {
        console.log('Goodbye!');
        await pool.end();
        process.exit(0);
      }

      if (input === '.help') {
        console.log('\nCommands:');
        console.log('  .exit, .quit     - Exit the CLI');
        console.log('  .tables          - Show all tables in current schema');
        console.log('  .schemas         - Show all schemas');
        console.log('  .databases       - Show all databases');
        console.log('  .version         - Show PostgreSQL version');
        console.log('  .help            - Show this help message');
        console.log('');
        return;
      }

      if (input === '.tables') {
        await executeQuery(
          pool,
          `SELECT table_schema, table_name
         FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name`
        );
        return;
      }

      if (input === '.schemas') {
        await executeQuery(
          pool,
          `SELECT schema_name
         FROM information_schema.schemata
         WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
         ORDER BY schema_name`
        );
        return;
      }

      if (input === '.databases') {
        await executeQuery(pool, 'SELECT datname FROM pg_database ORDER BY datname');
        return;
      }

      if (input === '.version') {
        await executeQuery(pool, 'SELECT version()');
        return;
      }

      await executeQuery(pool, input);
    } finally {
      rl.resume();
      rl.prompt();
    }
  });

  rl.on('close', async () => {
    console.log('\nGoodbye!');
    await pool.end();
    process.exit(0);
  });
}

async function main() {
  const pool = new Pool({
    connectionString: POSTGRES_DATABASE_URL,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    const client = await pool.connect();
    client.release();
    console.log('✓ Connected successfully\n');
  } catch (error: unknown) {
    console.error('✗ Failed to connect to PostgreSQL:', getErrorDetails(error).message);
    await pool.end();
    process.exit(1);
  }

  // Get query from command line arguments
  const query = process.argv.slice(2).join(' ');

  if (query) {
    // Execute single query and exit
    const succeeded = await executeQuery(pool, query);
    await pool.end();
    if (!succeeded) process.exitCode = 1;
  } else {
    // Start interactive mode
    await runInteractive(pool);
  }
}

main().catch(async (error: unknown) => {
  console.error('Fatal error:', getErrorDetails(error).message);
  process.exit(1);
});
