# Repository instructions

This is the shared entry point for contributors and coding agents. Keep detailed
UI and database guidance in the linked documents, not separate editor rule sets.

## Scope and development

- `apps/web` is the maintained product app. Read its [guide](apps/web/README.md)
  and consult the [roadmap](docs/MIGRATION.md) and
  [feature inventory](docs/APPS-AND-FEATURES.md) for current versus planned work.
- Use pnpm and the versions/scripts declared in the package manifests. Inspect a
  script before running it; similarly named root and app scripts have different
  database targets and side effects.
- Reuse existing components, utilities and installed libraries before adding
  dependencies. Check local implementations/types, then official documentation
  when needed. Do not replace a working pattern just to match a generic template.
- In `apps/web`, default pages to Server Components and isolate interactive client
  code in small components. Await asynchronous route `params`/`searchParams`.
  Prefer Server Actions for app mutations; use route handlers for HTTP APIs,
  webhooks and other integrations that need them.
- Put reusable components in `apps/web/components` and library code in
  `apps/web/lib`; route files belong in `apps/web/app`.
- Database row types come from the Prisma schema (`apps/web/prisma/schema.prisma`).
  Use the Prisma types or the helpers in `apps/web/lib/database.types.ts`
  (`Tables<'x'>`, `TablesInsert<'x'>`); regenerate the client rather than writing
  row types by hand. Separate UI, import and domain types are appropriate when
  they represent something other than a database row.
- Use `apps/web/lib/logger.ts` for application logging. Handle errors deliberately:
  propagate them or provide a meaningful recovery/error state, not empty catches
  or cosmetic renaming that hides failures. Never log secrets or private health data.

## Verification

For app code changes, run the relevant tests and checks from `apps/web`:

- `pnpm test:unit` and `pnpm type-check`.
- `pnpm lint`; `pnpm check` combines type checking and linting, without auto-fixing.
- `pnpm test:db` when queries, migrations or policies change. It needs
  `DATABASE_URL` set to an empty PostgreSQL database prepared with `pnpm db:plain:setup`.
- `pnpm build` when changes affect the production build, plus relevant integration
  tests for the changed workflow using a dedicated local/test environment.

Report passing, failing and unrun checks separately. Do not disable checks or
expand a focused task into unrelated repairs to claim a clean result. For
documentation-only changes, validate links, commands and consistency instead of
running unrelated app/database workflows.

## UI work

Before changing UI in `apps/web`, read [the design system](docs/DESIGN-SYSTEM.md)
and [the web app guide](apps/web/README.md). The design system is the shared source
of UI conventions for contributors and coding agents.

- Inspect the existing route and relevant landing-page/shared components before
  proposing a replacement. Reuse this app's theme and components; do not introduce
  a separate visual system for imported features.
- Follow the design guide's **UI change workflow** and **Definition of done**.
  Verify real interactions as well as appearance. Report checks that could not
  run; compilation alone is not visual verification.
- Keep detailed design rules in `docs/DESIGN-SYSTEM.md`; update shared patterns
  and their documentation together.

## Database and data boundaries

- Before changing app schema, queries or authentication, read the
  [database guide](apps/web/supabase/README.md). The app is moving from Supabase
  to plain PostgreSQL: table queries use Prisma (`apps/web/lib/db`); Supabase is
  still used for sign-in and file storage until those parts move.
- Query as the signed-in user with `getUserDb()` from `@/lib/db/server`, so the
  row-level security policies apply. Use `adminDb` (no row-level security) only in
  workers, scripts and server code that has already checked authorization. Never
  build a user-scoped client from an ID in request input.
- The web app's schema is the SQL in `apps/web/supabase/migrations`. The
  repository-root `schema` folder is an earlier, unapplied design; do not copy it
  into the app.
- Add schema changes as new SQL migrations, then run `pnpm db:pull` to update
  `prisma/schema.prisma` and the client. There are no real user accounts in
  production yet, so editing, squashing or rebaselining migrations is acceptable
  when it makes the move off Supabase simpler; say so in the pull request.
- Do not reset or overwrite a shared or production database as a development or
  testing step. `pnpm db:setup` resets the local Supabase database and changes
  storage with the configured credentials; check every target before running it.
  For tests, use `pnpm db:plain:setup` on an empty PostgreSQL database.
- Preserve the app's shared variable/measurement model and units where applicable;
  inspect the actual schema before introducing duplicate treatment/outcome storage.
  Keep user-scoped operations subject to authorization and row-level security, and
  add a database test (`apps/web/tests/db`) when you change a policy.
- Follow [evidence and exchange](docs/EVIDENCE-AND-EXCHANGE.md) for estimates,
  sources and private records. Keep credentials and private patient data out of
  Git. Retain provenance and checksums when importing demo or public source data.

## Working safely

- Preserve unrelated changes and local artifacts. Stage only reviewed, in-scope
  files; do not clear the index or reset another person's work.
- Name branches `<type>/<short-description>` in kebab case, for example
  `feature/postgres-prisma`, `fix/contact-messages-rls` or `docs/database-guide`.
  Use `feature`, `fix`, `docs`, `chore` or `refactor` as the type. When a tool
  assigns a generated branch name, move the work to a descriptive branch before
  opening the pull request.
- On Windows, quote paths and use native PowerShell filesystem commands with
  literal paths. Verify exact targets before deletion or moving directories.
- Keep compatibility files such as `CLAUDE.md` as pointers to this document,
  not independent collections of instructions.

These are contribution guidelines, not authorization to commit, push, deploy,
reset data or change the scope of a user's request.
