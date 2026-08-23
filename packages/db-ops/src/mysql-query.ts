#!/usr/bin/env tsx

/**
 * MySQL Query CLI Tool
 *
 * Usage:
 *   # Interactive mode (REPL)
 *   pnpm mysql
 *   tsx src/mysql-query.ts
 *
 *   # Execute a single query
 *   pnpm mysql "SELECT * FROM users LIMIT 5"
 *   tsx src/mysql-query.ts "SELECT * FROM users LIMIT 5"
 *
 *   # Another example
 *   pnpm mysql "SHOW TABLES"
 *
 * Environment Variables:
 *   MYSQL_DATABASE_URL - MySQL connection URL (required)
 *   Format: mysql://user:password@host:port/database
 */

import mysql from 'mysql2/promise';
import * as readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from package directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MYSQL_URL = process.env.MYSQL_DATABASE_URL;

if (!MYSQL_URL) {
  console.error('Error: MYSQL_DATABASE_URL environment variable is required');
  console.error('Format: mysql://user:password@host:port/database');
  process.exit(1);
}
const MYSQL_DATABASE_URL = MYSQL_URL;

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}

async function executeQuery(
  connection: mysql.Connection,
  query: string
): Promise<boolean> {
  try {
    const startTime = Date.now();
    const [rows] = await connection.query(query);
    const duration = Date.now() - startTime;

    if (Array.isArray(rows)) {
      console.log('\n📊 Results:');
      console.table(rows);
      console.log(`\n✓ ${rows.length} row(s) returned in ${duration}ms`);
    } else {
      console.log('\n✓ Query executed successfully');
      console.log(rows);
      console.log(`\n⏱️  ${duration}ms`);
    }
    return true;
  } catch (error: unknown) {
    console.error('\n✗ Query failed:', getErrorMessage(error));
    return false;
  }
}

async function runInteractive(connection: mysql.Connection) {
  console.log('\n🔍 MySQL Interactive Query Tool');
  console.log('Connected to:', MYSQL_DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('\nCommands:');
  console.log('  - Type SQL queries and press Enter');
  console.log('  - Type .exit or .quit to exit');
  console.log('  - Type .tables to show all tables');
  console.log('  - Type .help for more commands');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'mysql> ',
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
        await connection.end();
        process.exit(0);
      }

      if (input === '.help') {
        console.log('\nCommands:');
        console.log('  .exit, .quit     - Exit the CLI');
        console.log('  .tables          - Show all tables');
        console.log('  .databases       - Show all databases');
        console.log('  .help            - Show this help message');
        console.log('');
        return;
      }

      if (input === '.tables') {
        await executeQuery(connection, 'SHOW TABLES');
        return;
      }

      if (input === '.databases') {
        await executeQuery(connection, 'SHOW DATABASES');
        return;
      }

      await executeQuery(connection, input);
    } finally {
      rl.resume();
      rl.prompt();
    }
  });

  rl.on('close', async () => {
    console.log('\nGoodbye!');
    await connection.end();
    process.exit(0);
  });
}

async function main() {
  let connection: mysql.Connection;

  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_DATABASE_URL);
    console.log('✓ Connected successfully\n');
  } catch (error: unknown) {
    console.error('✗ Failed to connect to MySQL:', getErrorMessage(error));
    process.exit(1);
  }

  // Get query from command line arguments
  const query = process.argv.slice(2).join(' ');

  if (query) {
    // Execute single query and exit
    const succeeded = await executeQuery(connection, query);
    await connection.end();
    if (!succeeded) process.exitCode = 1;
  } else {
    // Start interactive mode
    await runInteractive(connection);
  }
}

main().catch((error: unknown) => {
  console.error('Fatal error:', getErrorMessage(error));
  process.exit(1);
});
