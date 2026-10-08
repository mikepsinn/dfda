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
   constraints, indexes and row-level security for new tables.
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

Both record each applied migration file name in the table
`schema_migrations.applied` (outside `public`, so Prisma does not see it).
A database that was built before this table existed needs
`pnpm db:migrate --baseline` once: it records every migration file as applied
and runs no SQL. Use it only when the database already has every migration.

```bash
createdb dfda_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm db:plain:setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm test:db
```

**Production.** Run `pnpm db:migrate --dry-run`, then `pnpm db:migrate`, with
the production `DATABASE_URL`, after a backup (on Neon, make a branch first)
and before you deploy code that needs the new schema.

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
