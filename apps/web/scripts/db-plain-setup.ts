/**
 * Builds the app schema in an empty PostgreSQL database.
 *
 * Applies db/bootstrap.sql (roles, auth.uid(), auth.users and storage
 * stand-ins), then every file in db/migrations in order, then the seed files
 * in db/seeds. It records the migrations in schema_migrations.applied, so
 * that `pnpm db:migrate` later applies only new ones. Used by the database
 * tests, CI and local development.
 *
 * Usage: DATABASE_URL=postgresql://... tsx scripts/db-plain-setup.ts [--no-seed]
 *
 * The script refuses to run when the public schema already has tables, so it
 * cannot overwrite an existing database.
 */
import { Client } from 'pg'
import {
  applyFile,
  bootstrapFile,
  createMigrationTable,
  migrationsDir,
  publicTableCount,
  recordMigration,
  requireDatabaseUrl,
  seedsDir,
  sqlFiles,
} from './lib/migrations'

async function main() {
  const databaseUrl = requireDatabaseUrl()
  const seed = !process.argv.includes('--no-seed')

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    if ((await publicTableCount(client)) > 0) {
      throw new Error('The public schema already has tables. Use an empty database, or run `pnpm db:migrate`.')
    }

    await applyFile(client, bootstrapFile)
    await createMigrationTable(client)
    const migrations = sqlFiles(migrationsDir)
    for (const file of migrations) {
      await applyFile(client, file)
      await recordMigration(client, file)
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
