#!/usr/bin/env tsx

/**
 * MySQL Database Statistics Tool
 *
 * Displays all tables with record counts and sizes
 *
 * Usage:
 *   # Show all tables with stats
 *   tsx src/mysql-stats.ts
 *
 *   # Or use npm script
 *   pnpm mysql:stats
 *
 * Environment Variables:
 *   MYSQL_DATABASE_URL - MySQL connection URL (required)
 *   Format: mysql://user:password@host:port/database
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

interface TableStats {
  tableName: string;
  rowCount: number;
  dataSize: string;
  indexSize: string;
  totalSize: string;
  engine: string;
  isEstimate: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function getTableStats(connection: mysql.Connection): Promise<TableStats[]> {
  // Get current database name
  const [dbRows] = await connection.query<any[]>('SELECT DATABASE() as db');
  const database = dbRows[0].db;

  console.log(`\n📊 Database: ${database}`);
  console.log('Fetching table statistics...\n');

  // Get all tables with their sizes
  const [tables] = await connection.query<any[]>(
    `
    SELECT
      table_name as tableName,
      engine,
      table_rows as rowCount,
      data_length as dataLength,
      index_length as indexLength,
      (data_length + index_length) as totalLength
    FROM information_schema.tables
    WHERE table_schema = ?
    ORDER BY (data_length + index_length) DESC
    `,
    [database]
  );

  const stats: TableStats[] = [];
  const errors: string[] = [];

  for (const table of tables) {
    let rowCount = table.rowCount; // Use estimate from information_schema as default
    let isEstimate = false;

    // Try to get exact count, but fall back to estimate if it fails
    try {
      const [countResult] = await connection.query<any[]>(
        `SELECT COUNT(*) as count FROM ??`,
        [table.tableName]
      );
      rowCount = countResult[0].count;
    } catch (error: any) {
      // If COUNT fails (e.g., due to GROUP BY issues in views), use the estimate
      isEstimate = true;
      errors.push(`${table.tableName}: ${error.message.split('\n')[0]}`);
    }

    stats.push({
      tableName: table.tableName,
      rowCount: rowCount,
      dataSize: formatBytes(table.dataLength || 0),
      indexSize: formatBytes(table.indexLength || 0),
      totalSize: formatBytes(table.totalLength || 0),
      engine: table.engine || 'Unknown',
      isEstimate: isEstimate,
    });
  }

  // Show warnings if any tables had errors
  if (errors.length > 0) {
    console.log('⚠️  Warning: Could not get exact counts for some tables (using estimates):');
    errors.forEach((err) => console.log(`   - ${err}`));
    console.log('');
  }

  return stats;
}

async function displayStats(stats: TableStats[]) {
  console.log('📋 Table Statistics:\n');

  // Calculate totals
  const totalTables = stats.length;
  const totalRows = stats.reduce((sum, s) => sum + s.rowCount, 0);

  // Display table with stats
  console.table(
    stats.map((s) => ({
      'Table': s.tableName,
      'Records': s.isEstimate ? `~${s.rowCount.toLocaleString()}` : s.rowCount.toLocaleString(),
      'Data Size': s.dataSize,
      'Index Size': s.indexSize,
      'Total Size': s.totalSize,
      'Engine': s.engine,
    }))
  );

  // Add note about estimates
  const hasEstimates = stats.some((s) => s.isEstimate);
  if (hasEstimates) {
    console.log('Note: Records prefixed with ~ are estimates from information_schema');
  }

  console.log('\n📈 Summary:');
  console.log(`  Total Tables: ${totalTables}`);
  console.log(`  Total Records: ${totalRows.toLocaleString()}`);

  // Get database size
  const totalDataSize = stats.reduce((sum, s) => {
    const match = s.totalSize.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return sum;
    const [, value, unit] = match;
    const multipliers: { [key: string]: number } = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    };
    return sum + parseFloat(value) * (multipliers[unit] || 0);
  }, 0);

  console.log(`  Total Database Size: ${formatBytes(totalDataSize)}\n`);
}

async function main() {
  let connection: mysql.Connection;

  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection(MYSQL_URL);
    console.log('✓ Connected successfully');
  } catch (error: any) {
    console.error('✗ Failed to connect to MySQL:', error.message);
    process.exit(1);
  }

  try {
    const stats = await getTableStats(connection);
    await displayStats(stats);
  } catch (error: any) {
    console.error('✗ Failed to get table statistics:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
