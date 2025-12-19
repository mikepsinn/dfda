#!/usr/bin/env tsx

/**
 * MySQL Temporary Tables Cleanup Script
 *
 * Truncates temporary and log tables that can safely be cleared:
 * - notifications
 * - connector_requests
 * - wp_posts
 * - wp_postmeta
 * - tracking_reminder_notifications
 * - sent_emails
 * - connector_imports
 * - failed_jobs
 * - oa_refresh_tokens
 * - sessions
 * - oa_access_tokens
 * - action_events
 * - oa_authorization_codes
 *
 * Usage:
 *   tsx src/mysql-cleanup.ts
 *   pnpm mysql:cleanup
 *
 * Environment Variables:
 *   MYSQL_DATABASE_URL - MySQL connection URL (required)
 */

import mysql from 'mysql2/promise';
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

// Tables to clean up
const TABLES_TO_CLEAN = [
  'notifications',
  'connector_requests',
  'wp_posts',
  'wp_postmeta',
  'tracking_reminder_notifications',
  'sent_emails',
  'connector_imports',
  'failed_jobs',
  'oa_refresh_tokens',
  'sessions',
  'oa_access_tokens',
  'action_events',
  'oa_authorization_codes',
];

interface CleanupResult {
  table: string;
  success: boolean;
  method: 'TRUNCATE' | 'DELETE';
  rowsDeleted?: number;
  error?: string;
}

async function cleanTable(
  connection: mysql.Connection,
  tableName: string
): Promise<CleanupResult> {
  // Try TRUNCATE first (faster)
  try {
    await connection.query(`TRUNCATE TABLE ??`, [tableName]);
    return {
      table: tableName,
      success: true,
      method: 'TRUNCATE',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If TRUNCATE fails (likely foreign key constraint), try DELETE
    if (error.message.includes('foreign key')) {
      try {
        const [result] = await connection.query<any>(`DELETE FROM ??`, [
          tableName,
        ]);
        return {
          table: tableName,
          success: true,
          method: 'DELETE',
          rowsDeleted: result.affectedRows,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (deleteError: any) {
        return {
          table: tableName,
          success: false,
          method: 'DELETE',
          error: deleteError.message,
        };
      }
    }
    return {
      table: tableName,
      success: false,
      method: 'TRUNCATE',
      error: error.message,
    };
  }
}

async function main() {
  let connection: mysql.Connection;

  try {
    console.log('🔗 Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✓ Connected successfully\n');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('✗ Failed to connect to MySQL:', error.message);
    process.exit(1);
  }

  console.log(`🧹 Cleaning ${TABLES_TO_CLEAN.length} tables...\n`);

  const results: CleanupResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < TABLES_TO_CLEAN.length; i++) {
    const tableName = TABLES_TO_CLEAN[i];
    process.stdout.write(
      `[${i + 1}/${TABLES_TO_CLEAN.length}] Cleaning ${tableName}...`
    );

    const result = await cleanTable(connection, tableName);
    results.push(result);

    if (result.success) {
      const methodStr =
        result.method === 'DELETE'
          ? ` (${result.rowsDeleted} rows deleted)`
          : '';
      console.log(` ✓ ${result.method}${methodStr}`);
    } else {
      console.log(` ✗ Failed: ${result.error}`);
    }
  }

  const duration = Date.now() - startTime;

  // Update table statistics
  console.log('\n📊 Updating table statistics...');
  try {
    const tableList = TABLES_TO_CLEAN.join(', ');
    await connection.query(`ANALYZE TABLE ${tableList}`);
    console.log('✓ Statistics updated\n');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log('⚠️  Failed to update statistics:', error.message, '\n');
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('📈 Summary:');
  console.log(`  Total Tables: ${TABLES_TO_CLEAN.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Duration: ${(duration / 1000).toFixed(2)}s\n`);

  if (failed > 0) {
    console.log('❌ Failed Tables:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.table}: ${r.error}`);
      });
    console.log('');
  }

  console.log('✓ Cleanup completed!');

  await connection.end();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
