# Database Operations Toolkit (db-ops)

A comprehensive CLI toolkit for database operations including:
- **MySQL Query CLI** - Interactive and command-line MySQL queries
- **PostgreSQL Query CLI** - Interactive and command-line PostgreSQL queries
- **MySQL to PostgreSQL Sync** - Sync data from MySQL to PostgreSQL with schema migration

## Features

### Query CLIs
- Interactive REPL mode for exploring databases
- Execute single queries from command line
- Formatted table output with timing
- Helper commands (.tables, .schemas, .databases, etc.)
- Uses connection URLs from environment variables

### MySQL to PostgreSQL Sync
- Automatically reads MySQL table schemas and creates corresponding PostgreSQL tables
- Converts MySQL data types to PostgreSQL equivalents
- Syncs data in batches for efficient processing
- Supports multiple tables in a single run

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

### 1. MySQL Query CLI

```bash
# Interactive mode (REPL)
pnpm mysql

# Execute a single query
pnpm mysql "SHOW TABLES"
pnpm mysql "SELECT * FROM users LIMIT 5"

# Or use tsx directly
tsx src/mysql-query.ts "SELECT COUNT(*) FROM users"
```

**Interactive commands:**
- `.tables` - Show all tables
- `.databases` - Show all databases
- `.help` - Show help
- `.exit` or `.quit` - Exit

### 2. PostgreSQL Query CLI

```bash
# Interactive mode (REPL)
pnpm postgres
# or
pnpm pg

# Execute a single query
pnpm postgres "SELECT version()"
pnpm pg "SELECT * FROM users LIMIT 5"

# Or use tsx directly
tsx src/postgres-query.ts "SELECT COUNT(*) FROM users"
```

**Interactive commands:**
- `.tables` - Show all tables in current schema
- `.schemas` - Show all schemas
- `.databases` - Show all databases
- `.version` - Show PostgreSQL version
- `.help` - Show help
- `.exit` or `.quit` - Exit

### 3. MySQL to PostgreSQL Sync

```bash
# Run the sync
pnpm sync

# Or use tsx directly
tsx src/index.ts
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
import { sync, type SyncConfig } from 'db-ops';

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
