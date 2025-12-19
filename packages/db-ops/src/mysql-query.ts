#!/usr/bin/env tsx

/**
 * MySQL Query CLI Tool
 *
 * Usage:
 *   # Interactive mode (REPL)
 *   tsx apps/web/lib/db/mysql-query.ts
 *
 *   # Execute a single query
 *   tsx apps/web/lib/db/mysql-query.ts "SELECT * FROM users LIMIT 5"
 *
 *   # Or use npm script
 *   pnpm mysql-query "SHOW TABLES"
 *
 * Environment Variables:
 *   MYSQL_DATABASE_URL - MySQL connection URL (required)
 *   Format: mysql://user:password@host:port/database
 */

import mysql from 'mysql2/promise';
import * as readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MYSQL_URL = process.env.MYSQL_DATABASE_URL;

if (!MYSQL_URL) {
  console.error('Error: MYSQL_DATABASE_URL environment variable is required');
  console.error('Format: mysql://user:password@host:port/database');
  process.exit(1);
}

async function executeQuery(connection: mysql.Connection, query: string) {
  try {
    const startTime = Date.now();
    const [rows, fields] = await connection.query(query);
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
  } catch (error: any) {
    console.error('\n✗ Query failed:', error.message);
  }
}

async function runInteractive(connection: mysql.Connection) {
  console.log('\n🔍 MySQL Interactive Query Tool');
  console.log('Connected to:', MYSQL_URL.replace(/:[^:@]+@/, ':****@'));
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
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

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
      rl.prompt();
      return;
    }

    if (input === '.tables') {
      await executeQuery(connection, 'SHOW TABLES');
      rl.prompt();
      return;
    }

    if (input === '.databases') {
      await executeQuery(connection, 'SHOW DATABASES');
      rl.prompt();
      return;
    }

    // Execute the query
    await executeQuery(connection, input);
    rl.prompt();
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
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✓ Connected successfully\n');
  } catch (error: any) {
    console.error('✗ Failed to connect to MySQL:', error.message);
    process.exit(1);
  }

  // Get query from command line arguments
  const query = process.argv.slice(2).join(' ');

  if (query) {
    // Execute single query and exit
    await executeQuery(connection, query);
    await connection.end();
  } else {
    // Start interactive mode
    await runInteractive(connection);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
