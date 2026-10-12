/**
 * Applies the new files in db/migrations to an existing database, such as
 * production. Each migration runs in its own transaction and is recorded in
 * schema_migrations.applied.
 *
 * Usage: DATABASE_URL=postgresql://... tsx scripts/db-migrate.ts [options]
 *
 *   --dry-run   List the migrations that would run, and change nothing.
 *   --deploy    The build step of a deployment (`pnpm build` runs it). On a
 *               production build on Vercel, apply the new migrations; on a
 *               preview build, only with MIGRATE_PREVIEW_DATABASE=1; on CI and
 *               local builds, do nothing (see skipMigrationsOnBuild).
 *   --baseline  Record every migration file as applied without running it.
 *               Use it once, on a database that already has the full schema
 *               but no migration record (a database built before this script).
 *   --baseline-through=<file>
 *               The same, but only for the files up to and including <file>
 *               (for example 20261008160000_table_better_auth.sql), for a
 *               database that has those migrations and not the newer ones.
 *               The next run applies the newer ones.
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
  isApplied,
  MIGRATION_LOCK_KEY,
  migrationsDir,
  publicTableCount,
  recordMigration,
  requireDatabaseUrl,
  skipMigrationsOnBuild,
  sqlFiles,
} from './lib/migrations'

/** The files to record for --baseline or --baseline-through, or null without either option. */
function baselineFiles(files: string[]): string[] | null {
  const through = process.argv.find((arg) => arg.startsWith('--baseline-through='))?.split('=')[1]
  if (through) {
    const index = files.findIndex((file) => path.basename(file) === through)
    if (index === -1) throw new Error(`No migration file is named ${through}.`)
    return files.slice(0, index + 1)
  }
  return process.argv.includes('--baseline') ? files : null
}

async function main() {
  if (process.argv.includes('--deploy')) {
    const reason = skipMigrationsOnBuild(process.env)
    if (reason) {
      console.log(`Database migrations skipped. ${reason}`)
      return
    }
  }

  const databaseUrl = requireDatabaseUrl()
  const dryRun = process.argv.includes('--dry-run')
  const files = sqlFiles(migrationsDir)
  const baseline = baselineFiles(files)

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    if (!(await hasMigrationTable(client))) {
      if ((await publicTableCount(client)) === 0) {
        throw new Error('The database is empty. Run `pnpm db:plain:setup` to build it.')
      }
      if (!baseline) {
        throw new Error(
          'The database has tables but no migration record. Record the migrations it already has once: ' +
            '`pnpm db:migrate --baseline-through=<the last migration it has>`, or `--baseline` when it has ' +
            'every migration in db/migrations. See db/README.md.',
        )
      }
      if (dryRun) {
        console.log(`Would record ${baseline.length} of ${files.length} migrations as applied.`)
        return
      }
      await client.query('BEGIN')
      try {
        await createMigrationTable(client)
        for (const file of baseline) {
          await recordMigration(client, file)
        }
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
      const newer = files.length - baseline.length
      console.log(
        `Recorded ${baseline.length} migrations as applied. No SQL was run.` +
          (newer > 0 ? ` Run again without the option to apply the ${newer} newer ones.` : ''),
      )
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
        // Two deployments that build at the same time: the second one waits
        // here, then finds the migration recorded and skips it.
        await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_KEY])
        if (await isApplied(client, name)) {
          await client.query('COMMIT')
          console.log(`Skipped ${name}: another run applied it.`)
          continue
        }
        // A migration that waits for a busy table fails after 10 seconds,
        // instead of holding up the site's queries that queue behind it.
        await client.query("SET LOCAL lock_timeout = '10s'")
        await applyFile(client, file)
        await recordMigration(client, file)
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
      console.log(`Applied ${name}`)
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
