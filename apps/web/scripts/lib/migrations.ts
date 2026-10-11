/**
 * Shared helpers for the database scripts (db-plain-setup.ts, db-migrate.ts).
 *
 * The SQL files in db/migrations are the source of truth for the schema. The
 * table schema_migrations.applied records which of them a database has, so
 * that `pnpm db:migrate` applies only the new ones. It is outside the public
 * schema, so `prisma db pull` does not see it.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Client } from 'pg'

export const appDir = path.resolve(__dirname, '..', '..')
export const bootstrapFile = path.join(appDir, 'db', 'bootstrap.sql')
export const migrationsDir = path.join(appDir, 'db', 'migrations')
export const seedsDir = path.join(appDir, 'db', 'seeds')

/** The .sql files in a folder, sorted by name (the migration order). */
export function sqlFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => path.join(dir, name))
}

export async function applyFile(client: Client, file: string) {
  try {
    await client.query(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to apply ${path.relative(appDir, file)}: ${(error as Error).message}`)
  }
}

export function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  return databaseUrl
}

export async function publicTableCount(client: Client): Promise<number> {
  const { rows } = await client.query<{ count: string }>(
    "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'",
  )
  return Number(rows[0].count)
}

export async function hasMigrationTable(client: Client): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    "SELECT to_regclass('schema_migrations.applied') IS NOT NULL AS exists",
  )
  return rows[0].exists
}

export async function createMigrationTable(client: Client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS schema_migrations;
    CREATE TABLE IF NOT EXISTS schema_migrations.applied (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `)
}

export async function appliedMigrations(client: Client): Promise<Set<string>> {
  const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations.applied')
  return new Set(rows.map((row) => row.name))
}

export async function recordMigration(client: Client, file: string) {
  await client.query(
    'INSERT INTO schema_migrations.applied (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [path.basename(file)],
  )
}
