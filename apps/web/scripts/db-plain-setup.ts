/**
 * Builds the app schema in an empty, plain PostgreSQL database.
 *
 * Applies prisma/supabase-compat.sql (roles, auth.uid(), auth.users and
 * storage stand-ins), then every file in supabase/migrations in order, then
 * the seed files in supabase/seeds. Used by the database tests and CI, and
 * for local development without the Supabase stack.
 *
 * Usage: DATABASE_URL=postgresql://... tsx scripts/db-plain-setup.ts [--no-seed]
 *
 * The script refuses to run when the public schema already has tables, so it
 * cannot overwrite an existing database.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

const appDir = path.resolve(__dirname, '..')
const compatFile = path.join(appDir, 'prisma', 'supabase-compat.sql')
const migrationsDir = path.join(appDir, 'supabase', 'migrations')
const seedsDir = path.join(appDir, 'supabase', 'seeds')

function sqlFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => path.join(dir, name))
}

async function applyFile(client: Client, file: string) {
  try {
    await client.query(readFileSync(file, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to apply ${path.relative(appDir, file)}: ${(error as Error).message}`)
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  const seed = !process.argv.includes('--no-seed')

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const { rows } = await client.query<{ count: string }>(
      "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'",
    )
    if (Number(rows[0].count) > 0) {
      throw new Error('The public schema already has tables. Use an empty database.')
    }

    await applyFile(client, compatFile)
    const migrations = sqlFiles(migrationsDir)
    for (const file of migrations) {
      await applyFile(client, file)
    }
    const seeds = seed ? sqlFiles(seedsDir) : []
    for (const file of seeds) {
      await applyFile(client, file)
    }
    console.log(`Applied ${migrations.length} migrations and ${seeds.length} seed files.`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
