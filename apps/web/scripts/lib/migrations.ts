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

export async function isApplied(client: Client, name: string): Promise<boolean> {
  const { rows } = await client.query('SELECT 1 FROM schema_migrations.applied WHERE name = $1', [name])
  return rows.length > 0
}

/**
 * The key of the advisory lock that db-migrate.ts takes in each migration
 * transaction, so that two deployments that build at the same time apply each
 * migration once. Any fixed number works; only this script uses it.
 */
export const MIGRATION_LOCK_KEY = 726_150_001

/**
 * Why a build must not change the database, or null when it applies the new
 * migrations (`db-migrate.ts --deploy`). A production build on Vercel
 * migrates. A preview build migrates only with MIGRATE_PREVIEW_DATABASE=1: set
 * it when each preview deployment has its own database branch (Neon's Vercel
 * integration); otherwise previews use the production database. CI and local
 * builds do not migrate.
 */
export function skipMigrationsOnBuild(env: Record<string, string | undefined>): string | null {
  if (env.SKIP_DB_MIGRATIONS === '1') return 'SKIP_DB_MIGRATIONS=1 is set.'
  if (env.VERCEL_ENV === 'production') return null
  if (env.VERCEL_ENV === 'preview') {
    return env.MIGRATE_PREVIEW_DATABASE === '1'
      ? null
      : 'This is a Vercel preview build without MIGRATE_PREVIEW_DATABASE=1: it may use the production database.'
  }
  return env.VERCEL_ENV
    ? `This is a Vercel ${env.VERCEL_ENV} build; only production and preview builds migrate the database.`
    : 'This is not a Vercel build; only Vercel builds migrate the database.'
}
