# MySQL to PostgreSQL Sync

A command-line tool to sync data from MySQL database to PostgreSQL database with automatic schema migration.

## Features

- Automatically reads MySQL table schemas and creates corresponding PostgreSQL tables
- Converts MySQL data types to PostgreSQL equivalents
- Syncs data in batches for efficient processing
- Supports multiple tables in a single run
- Uses connection URLs for easy configuration

## Installation

```bash
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and configure your database connections:

```bash
cp .env.example .env
```

Edit `.env` with your database URLs and tables to sync:

```env
# MySQL Database URL
MYSQL_DATABASE_URL=mysql://user:password@host:port/database

# PostgreSQL Database URL (you can use either POSTGRES_DATABASE_URL or DATABASE_URL)
POSTGRES_DATABASE_URL=postgresql://user:password@host:port/database

# Tables to sync (comma-separated)
SYNC_TABLES=users,posts,comments
```

### Connection URL Formats

**MySQL:**
```
mysql://username:password@hostname:port/database
```

**PostgreSQL:**
```
postgresql://username:password@hostname:port/database
```

## Usage

Run the sync:

```bash
pnpm sync
```

Or use npm scripts:

```bash
# Development mode with watch
pnpm dev

# Build the package
pnpm build
```

## How it Works

1. **Schema Migration**: Reads the schema from each MySQL table and creates corresponding PostgreSQL tables
2. **Data Type Conversion**: Automatically converts MySQL data types to PostgreSQL equivalents:
   - `int`, `tinyint`, `smallint`, `mediumint` → `integer`
   - `bigint` → `bigint`
   - `float`, `double` → `double precision`
   - `datetime`, `timestamp` → `timestamp`
   - `json` → `jsonb`
   - And more...
3. **Data Transfer**: Truncates PostgreSQL tables and inserts data in batches (1000 rows per batch)

## Example

```typescript
import { sync, type SyncConfig } from 'mysql-to-postgres-sync';

const config: SyncConfig = {
  mysqlUrl: 'mysql://root:password@localhost:3306/mydb',
  postgresUrl: 'postgresql://postgres:password@localhost:5432/mydb',
  tables: ['users', 'posts', 'comments'],
};

await sync(config);
```

## Notes

- The PostgreSQL tables will be **truncated** before data insertion to ensure clean sync
- Make sure the PostgreSQL user has permissions to create tables and insert data
- Large tables are processed in batches of 1000 rows to optimize performance
- All syncs run in a single transaction per table

## Requirements

- Node.js 18+
- MySQL database (source)
- PostgreSQL database (target)
