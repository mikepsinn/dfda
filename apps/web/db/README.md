# Web app database guide

The app uses plain PostgreSQL with Prisma. It does not use Supabase. The
production database is on [Neon](https://neon.tech); any PostgreSQL 16 host works.

- **Table queries** use Prisma through [`lib/db`](../lib/db). This is done.
- **Sign-in** uses [Better Auth](https://www.better-auth.com) through
  [`lib/auth.ts`](../lib/auth.ts). This is done.
- **File uploads** use a private S3-compatible bucket through
  [`lib/storage`](../lib/storage). This is done.
- **Schema changes** are SQL files in [migrations](migrations). Prisma reads the
  resulting database into [`prisma/schema.prisma`](../prisma/schema.prisma).
  [`bootstrap.sql`](bootstrap.sql) runs before the migrations, and the
  [seeds](seeds) after them.
- **Catalog rows** (variables, units) that an existing database also needs go in
  a seed file and in a migration. The migration adds them only when the catalog
  is already seeded, because a new database runs the seeds after the migrations.
  See [`20261011020000_catalog_lab_markers_and_peptides.sql`](migrations/20261011020000_catalog_lab_markers_and_peptides.sql).
  Visitors and signed-in users can only read the catalog. The exceptions are for
  the photo import: signed-in users can add a global variable and the details of
  a treatment, and a user who tracks a treatment can change its details
  ([`20261020010000_policy_catalog_tables.sql`](migrations/20261020010000_policy_catalog_tables.sql),
  [`20261020020000_policy_global_treatments_photo_import.sql`](migrations/20261020020000_policy_global_treatments_photo_import.sql)).
- **Standard codes** let data from other systems match the catalog. A variable's
  codes are rows of `global_variable_codes` (code system URI, code, the code
  system's name for it): a variable can have several, because labs report the
  same test by different methods, and a code belongs to one variable. They are
  LOINC codes for lab tests so far; RxNorm or SNOMED codes can follow in the same
  table. Conditions have ICD codes (`global_conditions.icd_code`) and units UCUM
  codes (`units.ucum_code`). A new code goes in a migration that adds it as
  [`20261021030000_table_global_variable_codes.sql`](migrations/20261021030000_table_global_variable_codes.sql)
  does, and in [`seeds/99_global_variable_codes.sql`](seeds/99_global_variable_codes.sql).
  [`tests/unit/catalog/variable-codes.test.ts`](../tests/unit/catalog/variable-codes.test.ts)
  checks that both give the same codes and each LOINC check digit, and
  `tests/db/catalog-tables.test.ts` that a new database has every one. Only the
  full-access client writes codes. This material contains content from LOINC
  (https://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the
  Logical Observation Identifiers Names and Codes (LOINC) Committee and is
  available at no cost under the license at https://loinc.org/license.

The repository-root `schema` folder is an earlier, unapplied design; do not
copy from it. Start with the shared [repository instructions](../../../AGENTS.md).

## Querying the database

| Context | Use | Notes |
| --- | --- | --- |
| Server Component, Server Action or route handler, for the signed-in user | `const db = await getUserDb()` from [`lib/db/server.ts`](../lib/db/server.ts) | Row-level security applies as the session user, or as the anonymous role when nobody is signed in. |
| Several writes that must succeed or fail together | `withUserTransaction(user, async (tx) => ...)` from [`lib/db`](../lib/db/index.ts) | Pass the session user. Keep the callback short. |
| Workers, scripts, and server code that has already checked authorization | `adminDb` from [`lib/db`](../lib/db/index.ts) | Full access; row-level security does not apply. |
| Client Components | A Server Action that uses `getUserDb()` | Prisma does not run in the browser. |

`getUserDb()` takes the user from the session. Do not create a user-scoped
client from an ID in request input: the policies would then trust that input.

How it works: the existing policies call `auth.uid()` and `auth.role()`, which
read `request.jwt.claims`. For each query, the user-scoped client sets that
value and switches to the `authenticated` or `anon` role inside a transaction.
The policies were first written for Supabase and work unchanged.

Model and field names are the table and column names (`db.measurements`,
`start_at`). Relation fields are mostly the related table name; a few have
readable names in the schema (for example `outcome_variable`).

Types:

- Use Prisma types, or the helpers in [`lib/database.types.ts`](../lib/database.types.ts)
  (`Tables<'measurements'>`, `TablesInsert<'measurements'>`, `Enums<'user_type_enum'>`).
- Timestamps and dates are `Date` objects. Pass `Date` objects when you write
  them; Prisma rejects date-only strings.
- `reminder_schedules.time_of_day` is a TIME column; convert it with
  [`lib/time-of-day.ts`](../lib/time-of-day.ts).
- Money columns are NUMERIC and come back as `Prisma.Decimal`. Convert them to
  numbers before you pass them to Client Components.

## Sign-in (Better Auth)

| Context | Use |
| --- | --- |
| Server configuration and server calls (`auth.api.*`) | [`lib/auth.ts`](../lib/auth.ts) |
| Browser / Client Component | `authClient` from [`lib/auth-client.ts`](../lib/auth-client.ts) |
| Current user in a page, action or route | `getServerUser()` from [`lib/server-auth.ts`](../lib/server-auth.ts) |
| Demo and test users with a password | `ensurePasswordUser()` from [`lib/auth-users.ts`](../lib/auth-users.ts) |

Users, sessions, accounts, OAuth clients and organizations are tables in the app
database (migration `20261008160000_table_better_auth.sql`). The `users.id`
value is a UUID and is the same as `profiles.id`, so `auth.uid()` in the
policies works as before. The `anon` and `authenticated` roles have no access
to the sign-in tables; only the server (`adminDb` and Better Auth) reads them.

A signed-in identity is not permission for every record: enforce ownership,
roles and the policies.

## File storage

Uploaded files are stored in one private S3-compatible bucket (AWS S3,
Cloudflare R2, MinIO, or a local S3 test server). Use the
functions in [`lib/storage`](../lib/storage/index.ts); do not create other S3
clients.

Settings: `S3_BUCKET` (required), `S3_REGION`, `S3_ENDPOINT` (for services other
than AWS), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_FORCE_PATH_STYLE`
(`true` for MinIO and the local test server). Without access keys the AWS default
credentials apply.

Rules:

- Each file is stored under `<userId>/<random uuid>.<extension>`. The bucket
  has no per-user rules, so take the user ID from the session, and check a key
  from request input with `isUserFileKey(user.id, key)` before you record,
  read or delete it.
- Browser uploads: the Server Action `createUploadUrlAction` returns a signed
  PUT URL (valid for 5 minutes, at most `MAX_UPLOAD_BYTES`). The content type
  and size are part of the signature, so storage refuses any other file. The
  browser sends the file, then calls `recordUploadMetadata`, which reads the
  size and type from storage and inserts the `uploaded_files` record. A
  repeated call returns the same record.
- Server uploads: `uploadUserFile(userId, file)`. Clean up with
  `deleteStoredFiles(keys)` when a later step fails.
- The bucket must allow cross-origin `PUT` requests with a `Content-Type`
  header from the app origins (bucket CORS settings).

For local development, `pnpm services:start` starts an S3 test server
([S3Mock](https://github.com/adobe/S3Mock)) on `http://127.0.0.1:9090` with the
bucket `dfda-uploads`; see [`.env.example`](../.env.example). `pnpm test:db`
needs an S3 server and the `S3_*` settings; CI uses the
[moto](https://github.com/getmoto/moto) server.

## Changing the schema

1. Write a SQL migration in [migrations](migrations) named
   `YYYYMMDDHHMMSS_<type>_<description>.sql`, with a type prefix such as
   `table_`, `alter_`, `policy_`, `function_`, `view_` or `index_`. Include
   constraints, indexes and row-level security for new tables:
   [`tests/db/catalog-tables.test.ts`](../tests/db/catalog-tables.test.ts) fails
   when a table in the `public` schema has no row-level security.
2. Apply it to your local database with `pnpm db:migrate`.
3. Run `pnpm db:pull` to update `prisma/schema.prisma` and the generated client.
   Review the schema diff. Relation fields that you renamed in the schema are kept.
4. Add or update a test in [`tests/db`](../tests/db) when you change a policy,
   and run `pnpm test:db`.

CI builds an empty PostgreSQL 16 database from the migrations, checks that
`prisma/schema.prisma` matches it, and runs `pnpm test:db`.

There are no real user accounts in production yet. Until there are, migrations
may be edited, squashed or rebaselined; describe the change in the pull
request. A database records the file names it has (see below), so an edited
migration does not run again on an existing database.

Prisma reads only the `public` schema. Keep foreign keys inside `public` (point
to `profiles`, not `auth.users`), and use enum values that are valid
identifiers (`research_partner`, not `research-partner`); otherwise Prisma
gives TypeScript values that differ from the database.

## Building and migrating a database

[`bootstrap.sql`](bootstrap.sql) creates what the migrations expect from their
Supabase origin: the `anon`, `authenticated` and `service_role` roles,
`auth.uid()`, `auth.role()`, a minimal `auth.users` table and
`storage.objects`.

- `pnpm db:plain:setup` builds an **empty** database: `bootstrap.sql`, all
  migrations, then the seeds (`--no-seed` skips them). It refuses to run when
  the database already has tables.
- `pnpm db:migrate` applies the new migrations to an **existing** database,
  each in its own transaction. `--dry-run` lists them and changes nothing.
- `pnpm db:seed:demo` adds the demo clinic to a **local or CI** database: the
  company instance `/i/acme-metabolic`, its GLP-1 program, 10 people who joined
  it and a demo patient, with made-up values. The accounts and their password
  are in [`scripts/demo-data.json`](../scripts/demo-data.json); sign in as
  `demo-company@example.com`, `demo-member1@example.com` or
  `demo-clinic-patient@example.com`. It refuses a database on another host. The
  screenshot workflow and the browser tests (`pnpm test:e2e`) use it. A
  deployment needs no seed: the **Demo clinic owner** and **Demo clinic
  patient** buttons on the sign-in page create the same clinic on first use
  ([`lib/demo/clinic.ts`](../lib/demo/clinic.ts)), and each patient sign-in
  gives the demo patient fresh values.

Both record each applied migration file name in the table
`schema_migrations.applied` (outside `public`, so Prisma does not see it).
A database that was built before this table existed needs one baseline run.
It records migrations as applied and runs no SQL:

- `pnpm db:migrate --baseline-through=<file>` records the files up to and
  including `<file>`, for a database that has those migrations and not the
  newer ones. The next run applies the newer ones.
- `pnpm db:migrate --baseline` records every file, for a database that has every
  migration.

Before you choose `<file>`, check which migrations the database has: a file that
is recorded but was never applied does not run later.

```bash
createdb dfda_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm db:plain:setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm test:db
```

## Deployments

`pnpm build` runs `db-migrate.ts --deploy` before `next build`:

- A **production** build on Vercel (`VERCEL_ENV=production`) applies the new
  migrations to the production database. If one fails, the build fails and the
  current deployment stays live; the migrations before it stay applied.
- A **preview** build applies them only with `MIGRATE_PREVIEW_DATABASE=1`. Set
  it in the Vercel Preview environment only when each preview deployment has its
  own database branch (Neon's Vercel integration). Without such branches,
  previews use the production database, and an unmerged pull request must not
  change it.
- CI and local builds do not migrate. `SKIP_DB_MIGRATIONS=1` turns the step off
  for any build.

Each migration runs in one transaction under an advisory lock, so two builds
that run at the same time apply it once. A migration that waits more than 10
seconds for a locked table fails, so that it does not hold up the site.

The live deployment uses the new schema until the new deployment replaces it,
and a Vercel rollback does not undo a migration. So:

- Add tables and columns; do not rename or drop them in the same change. First
  make the code stop using a column, deploy, then drop it in a later migration.
- An edited migration does not run again on production. To change what
  production has, add a new migration.
- To undo a migration on production, restore the database to a time before the
  deployment (Neon point-in-time restore).

To check a database by hand: `pnpm db:migrate --dry-run` with its
`DATABASE_URL`.

## Local commands and safety

Run app commands from `apps/web`, and read [package.json](../package.json) and
the scripts before you run them. Every database command acts on the database in
`DATABASE_URL`; check it before you run one.

- `pnpm services:start` / `pnpm services:stop` start and stop the local
  services in [`docker-compose.yml`](../../../docker-compose.yml): PostgreSQL 16
  (`postgresql://postgres:postgres@127.0.0.1:5432/dfda`), Mailpit for email
  (inbox at http://127.0.0.1:8025) and the S3 test server.
- `pnpm db:plain:setup` builds an empty database; `pnpm db:migrate` applies new
  migrations.
- `pnpm db:worker:migrate` creates the job queue schema (graphile-worker).
- `pnpm db:pull` updates the Prisma schema and client from `DATABASE_URL`.
- `pnpm db:generate` regenerates the Prisma client only (also runs on install).

Never reset a remote or shared database as a development or test step.
