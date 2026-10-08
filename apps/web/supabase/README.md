# Web app database guide

The app is moving from Supabase to plain PostgreSQL with Prisma:

- **Table queries** use Prisma through [`lib/db`](../lib/db). This is done.
- **Sign-in** still uses Supabase Auth (`supabase.auth.*`).
- **File uploads** use a private S3-compatible bucket through
  [`lib/storage`](../lib/storage). This is done.
- **Schema changes** are SQL files in [migrations](migrations). Prisma reads the
  resulting database into [`prisma/schema.prisma`](../prisma/schema.prisma).

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
This works the same on Supabase and on plain PostgreSQL.

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

## Supabase clients (sign-in only)

| Context | Wrapper |
| --- | --- |
| Browser / Client Component | [`utils/supabase/client.ts`](../utils/supabase/client.ts) |
| Server, acting for a user | [`utils/supabase/server.ts`](../utils/supabase/server.ts) |
| Auth admin calls | [`utils/supabase/admin.ts`](../utils/supabase/admin.ts) (service-role key; never in the browser) |
| Session refresh in middleware | [`utils/supabase/middleware.ts`](../utils/supabase/middleware.ts) |

To get the current user on the server, use `getServerUser()` from
[`lib/server-auth.ts`](../lib/server-auth.ts) (it calls `supabase.auth.getUser()`).
Do not use the user from `getSession()` alone for authorization. A signed-in
identity is not permission for every record: enforce ownership, roles and the
policies.

## File storage

Uploaded files are stored in one private S3-compatible bucket (AWS S3,
Cloudflare R2, MinIO, or the S3 endpoint of Supabase Storage). Use the
functions in [`lib/storage`](../lib/storage/index.ts); do not create other S3
clients.

Settings: `S3_BUCKET` (required), `S3_REGION`, `S3_ENDPOINT` (for services other
than AWS), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_FORCE_PATH_STYLE`
(`true` for MinIO and Supabase). Without access keys the AWS default
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

For local development, use the S3 endpoint of the local Supabase stack
(`http://127.0.0.1:54321/storage/v1/s3`, keys from `pnpm sb:local:status`) or
any other S3-compatible server. `pnpm test:db` needs an S3 server and the
`S3_*` settings; CI uses the [moto](https://github.com/getmoto/moto) server.

## Changing the schema

1. Write a SQL migration in [migrations](migrations) named
   `YYYYMMDDHHMMSS_<type>_<description>.sql`, with a type prefix such as
   `table_`, `alter_`, `policy_`, `function_`, `view_` or `index_`. Include
   constraints, indexes and row-level security for new tables.
2. Apply it to your local database (`pnpm db:local:push` for the local Supabase
   stack, or rebuild a plain database with `pnpm db:plain:setup`).
3. Run `pnpm db:pull` to update `prisma/schema.prisma` and the generated client.
   Review the schema diff. Relation fields that you renamed in the schema are kept.
4. Add or update a test in [`tests/db`](../tests/db) when you change a policy,
   and run `pnpm test:db`.

CI builds an empty PostgreSQL 16 database from the migrations, checks that
`prisma/schema.prisma` matches it, and runs `pnpm test:db`.

There are no real user accounts in production yet. Until there are, migrations
may be edited, squashed or rebaselined when that makes the move off Supabase
simpler; describe the change in the pull request.

Prisma reads only the `public` schema. Keep foreign keys inside `public` (point
to `profiles`, not `auth.users`), and use enum values that are valid
identifiers (`research_partner`, not `research-partner`); otherwise Prisma
gives TypeScript values that differ from the database.

## Plain PostgreSQL

[`prisma/supabase-compat.sql`](../prisma/supabase-compat.sql) creates the
parts of Supabase that the migrations expect (the `anon`, `authenticated` and
`service_role` roles, `auth.uid()`, `auth.role()`, a minimal `auth.users`
table and `storage.objects`). It does nothing on a Supabase database.

```bash
createdb dfda_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm db:plain:setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dfda_test pnpm test:db
```

`db:plain:setup` applies the compatibility file, all migrations and the seeds.
It refuses to run when the database already has tables.

## Local commands and safety

Run app commands from `apps/web`, and read [package.json](../package.json) and
the scripts before you run them. Commands with `--linked` or `cloud` in their
names act on a remote project.

- `pnpm sb:local:start` / `pnpm sb:local:status` start and inspect the local Supabase stack
  (still needed for sign-in during development).
- `pnpm db:local:push` applies pending migrations to the local Supabase database.
- `pnpm db:pull` updates the Prisma schema and client from `DATABASE_URL`.
- `pnpm db:generate` regenerates the Prisma client only (also runs on install).

**Do not run `pnpm db:setup` without checking it first.**
[`setup-local-full.ts`](../scripts/setup-local-full.ts) starts Supabase, resets
the local database, runs worker migrations, changes storage with the `.env`
credentials and regenerates files. Never reset a remote or shared database as a
development or test step.
