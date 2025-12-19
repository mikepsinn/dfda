import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import format from 'pg-format';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from package directory
dotenv.config({ path: path.join(__dirname, '../.env') });

interface SyncConfig {
  mysqlUrl: string;
  postgresUrl: string;
  tables: string[];
}

async function getTableSchema(mysqlConn: mysql.Connection, tableName: string) {
  const [columns] = await mysqlConn.query(
    'SHOW COLUMNS FROM ??',
    [tableName]
  );
  return columns;
}

async function getTableData(mysqlConn: mysql.Connection, tableName: string) {
  const [rows] = await mysqlConn.query(
    'SELECT * FROM ??',
    [tableName]
  );
  return rows;
}

async function createPostgresTable(
  pgPool: Pool,
  tableName: string,
  columns: any[]
) {
  const columnDefs = columns.map(col => {
    let pgType = 'text'; // default type
    switch (col.Type.toLowerCase()) {
      case 'int':
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
        pgType = 'integer';
        break;
      case 'bigint':
        pgType = 'bigint';
        break;
      case 'float':
      case 'double':
        pgType = 'double precision';
        break;
      case 'decimal':
        pgType = 'decimal';
        break;
      case 'datetime':
      case 'timestamp':
        pgType = 'timestamp';
        break;
      case 'boolean':
        pgType = 'boolean';
        break;
      case 'json':
        pgType = 'jsonb';
        break;
    }
    
    return `${col.Field} ${pgType}${col.Null === 'NO' ? ' NOT NULL' : ''}`;
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columnDefs.join(',\n      ')}
    )
  `;

  await pgPool.query(createTableSQL);
}

async function syncTable(
  mysqlConn: mysql.Connection,
  pgPool: Pool,
  tableName: string
) {
  console.log(`Syncing table: ${tableName}`);
  
  // Get MySQL schema and data
  const schema = await getTableSchema(mysqlConn, tableName);
  const data = await getTableData(mysqlConn, tableName);

  // Create PostgreSQL table
  await createPostgresTable(pgPool, tableName, schema);

  // Clear existing data
  await pgPool.query(`TRUNCATE TABLE ${tableName}`);

  // Insert data in batches
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    if (batch.length === 0) continue;

    const columns = Object.keys(batch[0]);
    const values = batch.map(row => columns.map(col => row[col]));
    
    const insertSQL = format(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES %L`,
      values
    );
    
    await pgPool.query(insertSQL);
  }

  console.log(`Synced ${data.length} rows for table: ${tableName}`);
}

async function sync(config: SyncConfig) {
  const mysqlConn = await mysql.createConnection(config.mysqlUrl);
  const pgPool = new Pool({ connectionString: config.postgresUrl });

  try {
    for (const table of config.tables) {
      await syncTable(mysqlConn, pgPool, table);
    }
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

// Example usage:
if (require.main === module) {
  const mysqlUrl = process.env.MYSQL_DATABASE_URL;
  const postgresUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;
  const tables = (process.env.SYNC_TABLES || '').split(',').filter(Boolean);

  if (!mysqlUrl) {
    console.error('Error: MYSQL_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!postgresUrl) {
    console.error('Error: POSTGRES_DATABASE_URL or DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (tables.length === 0) {
    console.error('Error: SYNC_TABLES environment variable is required (comma-separated list of tables)');
    process.exit(1);
  }

  const config: SyncConfig = {
    mysqlUrl,
    postgresUrl,
    tables,
  };

  console.log(`Starting sync of ${tables.length} tables from MySQL to PostgreSQL...`);
  sync(config)
    .then(() => console.log('✓ Sync completed successfully'))
    .catch(err => {
      console.error('✗ Sync failed:', err);
      process.exit(1);
    });
}

export { sync, type SyncConfig }; 