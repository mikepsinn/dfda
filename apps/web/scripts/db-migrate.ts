/**
 * Applies the new files in db/migrations to an existing database, such as
 * production. Each migration runs in its own transaction and is recorded in
 * schema_migrations.applied.
 *
 * Usage: DATABASE_URL=postgresql://... tsx scripts/db-migrate.ts [--dry-run] [--baseline]
 *
 *   --dry-run   List the migrations that would run, and change nothing.
 *   --baseline  Record every migration file as applied without running it.
 *               Use it once, on a database that already has the full schema
 *               but no migration record (a database built before this script).
 *
 * For an empty database, use `pnpm db:plain:setup` instead: it also applies
 * db/bootstrap.sql and the seed files.
 */
import path from 'node:path'
import { Client } from 'pg'
import {
  appliedMigrations,
  applyFile,
  createMigrationTable,
  hasMigrationTable,
  migrationsDir,
  publicTableCount,
  recordMigration,
  requireDatabaseUrl,
  sqlFiles,
} from './lib/migrations'

async function main() {
  const databaseUrl = requireDatabaseUrl()
  const dryRun = process.argv.includes('--dry-run')
  const baseline = process.argv.includes('--baseline')
  const files = sqlFiles(migrationsDir)

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    if (!(await hasMigrationTable(client))) {
      if ((await publicTableCount(client)) === 0) {
        throw new Error('The database is empty. Run `pnpm db:plain:setup` to build it.')
      }
      if (!baseline) {
        throw new Error(
          'The database has tables but no migration record. If it already has every ' +
            'migration in db/migrations, run this script once with --baseline.',
        )
      }
      if (dryRun) {
        console.log(`Would record ${files.length} migrations as applied.`)
        return
      }
      await client.query('BEGIN')
      await createMigrationTable(client)
      for (const file of files) {
        await recordMigration(client, file)
      }
      await client.query('COMMIT')
      console.log(`Recorded ${files.length} migrations as applied. No SQL was run.`)
      return
    }
    if (baseline) {
      throw new Error('The database already has a migration record. Do not use --baseline.')
    }

    const applied = await appliedMigrations(client)
    const pending = files.filter((file) => !applied.has(path.basename(file)))
    if (pending.length === 0) {
      console.log('No new migrations.')
      return
    }
    for (const file of pending) {
      const name = path.basename(file)
      if (dryRun) {
        console.log(`Would apply ${name}`)
        continue
      }
      await client.query('BEGIN')
      try {
        await applyFile(client, file)
        await recordMigration(client, file)
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
      console.log(`Applied ${name}`)
    }
  } catch (error) {
    if (baseline) {
      await client.query('ROLLBACK').catch(() => undefined)
    }
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
