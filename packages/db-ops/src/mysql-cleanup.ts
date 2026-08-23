#!/usr/bin/env tsx

/**
 * MySQL Table Cleanup Script
 *
 * Permanently removes all rows from the configured tables, including WordPress
 * content tables. Review TABLES_TO_CLEAN before every confirmed run.
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
 *   pnpm mysql:cleanup -- --dry-run
 *   pnpm mysql:cleanup -- --yes
 *   pnpm mysql:cleanup -- --yes --allow-production
 *
 * Environment Variables:
 *   MYSQL_DATABASE_URL - MySQL connection URL (required)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from package directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRMED = process.argv.includes('--yes');
const ALLOW_PRODUCTION = process.argv.includes('--allow-production');
const MYSQL_URL = process.env.MYSQL_DATABASE_URL;

if (!MYSQL_URL && !DRY_RUN) {
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

function getErrorDetails(error: unknown): {
  message: string;
  code?: string;
  errno?: number;
} {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error) };
  }

  const candidate = error as { message?: unknown; code?: unknown; errno?: unknown };
  return {
    message: typeof candidate.message === 'string' ? candidate.message : String(error),
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    errno: typeof candidate.errno === 'number' ? candidate.errno : undefined,
  };
}

function isProductionLike(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    const databaseName = url.pathname.replace(/^\//, '').toLowerCase();
    return !localHosts.has(url.hostname) || /(^|[_-])(prod|production)([_-]|$)/.test(databaseName);
  } catch {
    return true;
  }
}

function printCleanupPlan() {
  console.log('This command permanently removes all rows from:');
  TABLES_TO_CLEAN.forEach((table) => console.log(`  - ${table}`));
}

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
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    const hasForeignKeyConstraint = details.code === 'ER_TRUNCATE_ILLEGAL_FK'
      || details.errno === 1701;

    if (hasForeignKeyConstraint) {
      try {
        const [result] = await connection.query<mysql.ResultSetHeader>(
          `DELETE FROM ??`,
          [tableName]
        );
        return {
          table: tableName,
          success: true,
          method: 'DELETE',
          rowsDeleted: result.affectedRows,
        };
      } catch (deleteError: unknown) {
        return {
          table: tableName,
          success: false,
          method: 'DELETE',
          error: getErrorDetails(deleteError).message,
        };
      }
    }
    return {
      table: tableName,
      success: false,
      method: 'TRUNCATE',
      error: details.message,
    };
  }
}

async function main() {
  printCleanupPlan();

  if (DRY_RUN) {
    console.log('\nDry run only; no database connection was opened and no rows were deleted.');
    return;
  }

  if (!CONFIRMED) {
    console.error('\nRefusing to run without explicit confirmation.');
    console.error('Re-run with --dry-run to preview or --yes to confirm.');
    process.exitCode = 1;
    return;
  }

  if (!MYSQL_URL) {
    console.error('Error: MYSQL_DATABASE_URL environment variable is required');
    process.exitCode = 1;
    return;
  }

  if (isProductionLike(MYSQL_URL) && !ALLOW_PRODUCTION) {
    console.error('\nRefusing to clean a remote or production-like database.');
    console.error('Add --allow-production only after verifying the target and backups.');
    process.exitCode = 1;
    return;
  }

  let connection: mysql.Connection;

  try {
    console.log('🔗 Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✓ Connected successfully\n');
  } catch (error: unknown) {
    console.error('✗ Failed to connect to MySQL:', getErrorDetails(error).message);
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

  // Update table statistics without allowing one missing table to stop the rest.
  console.log('\n📊 Updating table statistics...');
  for (const tableName of TABLES_TO_CLEAN) {
    try {
      await connection.query('ANALYZE TABLE ??', [tableName]);
    } catch (error: unknown) {
      console.log(`⚠️  Failed to analyze ${tableName}:`, getErrorDetails(error).message);
    }
  }
  console.log('✓ Statistics update attempts completed\n');

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
    process.exitCode = 1;
  }

  console.log('✓ Cleanup completed!');

  await connection.end();
}

main().catch((error: unknown) => {
  console.error('Fatal error:', getErrorDetails(error).message);
  process.exit(1);
});
