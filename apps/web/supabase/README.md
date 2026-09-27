# Web app database and client guide

This guide covers `apps/web/supabase`, its [configuration](config.toml) and
[migrations](migrations). The repository-root `supabase` directory has separate
schema/tooling; do not assume its commands or schema layout apply to this app.
Start with the shared [repository instructions](../../../AGENTS.md).

## Supabase clients

Use the existing wrappers rather than constructing a differently configured
client in each component or action:

| Context | Wrapper | Usage |
| --- | --- | --- |
| Browser / Client Component | [`utils/supabase/client.ts`](../utils/supabase/client.ts) | Call `createClient()` (also exported as `createBrowserClient`). Never import the admin wrapper here. |
| Server Component / Server Action, acting for a user | [`utils/supabase/server.ts`](../utils/supabase/server.ts) | `const supabase = await createClient()`. Also exported as `createServerClient`; the wrapper obtains cookies itself and takes no service-role option. |
| Explicitly authorized, privileged server operation | [`utils/supabase/admin.ts`](../utils/supabase/admin.ts) | `supabaseAdmin` is an already-created client using the service-role key. It bypasses RLS, so authorization and scope checks must happen before use. Do not substitute it for ordinary user-scoped queries. |
| Session refresh in middleware | [`utils/supabase/middleware.ts`](../utils/supabase/middleware.ts) | Reuse `updateSession` and preserve the returned response/cookie updates through redirects or response changes. |

For the current user-context flow, call `supabase.auth.getUser()` and handle
errors or an absent user before protected operations. Do not treat the user
object returned by `getSession()` alone as server-side authorization. An
authenticated identity is not permission for every record: enforce ownership,
roles and RLS policies as appropriate. Never expose service-role credentials to
the browser or commit them to Git. These are implementation rules, not a claim
that every existing route has passed a security audit.

## Schema conventions

- Inspect the actual migrations and [generated types](../lib/database.types.ts)
  before designing new tables. Preserve existing variable/measurement reuse and
  unit relationships instead of creating parallel storage for each treatment or
  outcome type.
- Use clear names consistent with neighboring objects. The old multi-schema
  editor proposal and blanket ban on `user_` prefixes are not app requirements.
- Keep each migration focused on one logical object/change, with explicit
  dependencies, constraints, indexes and RLS behavior where relevant.
- Test user access and cross-user denial, not just successful admin queries.

## Migration policy

New migration files use:

```text
YYYYMMDDHHMMSS_<type>_<description>.sql
```

Keep descriptive type prefixes such as `table_`, `function_`, `view_`, `policy_`,
`trigger_`, `index_`, `constraint_`, `enum_`, `extension_` and `alter_`.

1. Inspect the existing files and the intended database's applied migration
   history before selecting a new, unique timestamp.
2. Add forward migrations after the existing history and after their dependencies.
   The initial `20240101...` files use type/time grouping; this is legacy ordering,
   not a reason to backdate new changes into an already-applied sequence.
3. Do not edit, rename or reorder applied migrations to change a deployed schema.
   Use a new corrective migration. Rebuilding an initial baseline is a separate,
   explicitly approved operation against a verified disposable environment.
4. Review the SQL for data loss and authorization changes, then test it against a
   dedicated local/test database with representative data. Verify preservation
   of existing records, constraints, dependent views/functions and RLS policies.
5. Regenerate affected types/schemas and inspect the generated diff. Do not
   silently include unrelated generation output in the patch.

## Local commands and safety

Run app commands from `apps/web`; inspect [package.json](../package.json) and the
underlying scripts before execution. First verify the local Supabase instance and
every configured database/storage target. Commands with `--linked` or remote/cloud
names are not substitutes for local validation.

- `pnpm sb:local:status` inspects the local stack.
- `pnpm db:local:push` applies pending migrations to the local database; inspect
  the SQL and confirm the intended writes are authorized first.
- `pnpm db:local:types` regenerates `lib/database.types.ts` from the local schema.
  Do not hand-edit that generated file.
- `pnpm generate:schemas` regenerates the Zod schema file from those types;
  `pnpm generate:constants` refreshes constants when the change requires it.
  Review the scripts' environment dependencies and all resulting file changes.

**Do not automatically run `pnpm db:setup` or a reset after an SQL edit.**
[`setup-local-full.ts`](../scripts/setup-local-full.ts) starts Supabase, resets
the local database, runs worker migrations, changes storage via `.env` credentials
and regenerates multiple files. A local-looking command does not prove every
configured service is local. Resets/data deletion require explicit authorization
and a verified disposable target; use backups when preserving data matters.
Remote resets are not a development or test step.

After a schema change, run relevant migration/integration tests, `pnpm test:unit`
and `pnpm type-check`. Report unavailable services or unrun checks explicitly.
Documentation-only work does not require applying migrations, regenerating types
or starting/resetting a database.
