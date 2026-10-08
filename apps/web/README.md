# dFDA web app

`apps/web` is the canonical Next.js product application. It stores its data in
PostgreSQL through Prisma and uploaded files in an S3-compatible bucket;
Supabase still provides sign-in while the app moves off it.
`prototype.dfda.earth` is its reference deployment. The same codebase is
intended to serve the public site, personal health workspaces and clinic workspaces
at `dfda.earth`, or run as a branded independent installation. One maintained
release, not a fork per clinic. The domain cutover, independent installation
packaging and clinic data exchange are still planned; patient screens alone do
not implement local-first or operator-blind encrypted storage.

## Scope and status

The [apps and features inventory](../../docs/APPS-AND-FEATURES.md) lists the
screens and supporting components that exist, the features to extract from
other repositories, and the remaining work. Code or screen presence does not
establish that a workflow is complete.

The [migration plan](../../docs/MIGRATION.md) is the implementation roadmap.
Keep feature status in the inventory and implementation order and evidence
rules in that plan, rather than maintaining another sitemap or roadmap here.
The [product architecture](../../docs/PRODUCT-ARCHITECTURE.md) defines module,
deployment and branding boundaries. [Evidence and exchange](../../docs/EVIDENCE-AND-EXCHANGE.md)
defines where external sources, treatment reports, study workflows and exchange
schemas belong.

The immediate goal is a compelling, clearly labeled demo. Keep useful AI-generated
content and numbers as provisional current best estimates, and improve them as
better data arrives. Distinguish illustrative example data from model estimates
and source-backed results; complete evidence coverage is not a demo launch gate.

The functional target is to reproduce the useful curedao-api app: import/log
measurements, inspect history/charts, find predictors, generate personal and
population studies, read/share/export reports and keep tracking with reminders.
Existing studies computed from measurements are source-backed observational
analyses, not `ModelEstimate` or `DemoExample` records. Import eligible historical
results with provenance and reproduction status, then reproduce and improve their
calculations and reports. The [legacy baseline](../../docs/MIGRATION.md#what-comes-from-curedao-api)
defines workflow/numerical acceptance and continuity; these capabilities are
targets, not a claim that this app already matches the legacy system.

For data population, start with versioned JSON/JSONL demo packs and one validated
importer, then expose the same service through scoped MCP tools and an admin review
screen. The medical dataset forked from Optimitron now lives in `data/optimitron/` and powers
`/treatment-rankings` and `/outcome-labels/demo/...` without database or paid AI
calls for all 216 conditions and 1,214 treatment comparisons. See
[dataset notes](data/optimitron/README.md) for its origin, how to correct values with sources,
and redistribution review. The general-purpose `lib/evidence/import` service remains
planned. A separate [posted-trial snapshot](data/evidence/README.md) now adds
one source-linked suvorexant/placebo comparison to the insomnia Outcome Label;
its reported effect and interval do not alter the provisional scores. Keep private/restricted source data out of Git and keep
evidence submission separate from publication and personal-data access. See the
[population workflow](../../docs/EVIDENCE-AND-EXCHANGE.md#populate-data-through-files-mcp-and-the-admin-ui)
and [next implementation slice](../../docs/MIGRATION.md#next-implementation-slice).

- Public pages, patient tracking, provider and research-partner workflows,
  administration, and developer access belong to this app.
- Reusable analysis, trial-data ingestion, health vocabulary, evidence contracts,
  export parsers and clinic aggregate validation belong to the planned shared packages.
- Source access/review/publication belongs in `lib/evidence`; study lifecycle
  orchestration in `lib/studies`; branding in `lib/instance`; authorized personal
  export orchestration in `lib/data-export`. These modules are planned, not present.
- Third-party connections and OAuth/data imports remain app capabilities.
  Export parsers are only part of that work; connection authorization and
  token handling still need design and implementation.
- The evidence pipeline imports, reviews, analyzes and publishes sources and
  estimates. It works without sharing data between independent installations.
- Installation registration, authenticated submissions, network monitoring, and
  contribution policies belong to the planned clinic data exchange's administration.
  Start with app-owned modules and restricted jobs, not another product website.
  Separate processes/services when needed for isolation or operations.
- Existing AI-assisted capture and chat code remains. Parsing a person's
  input is distinct from generating provisional estimates. Both are supported;
  public displays follow the migration plan's origin-labeling and progressive
  improvement rules, without presenting model output as observed patient/trial data.

## Data and access boundaries

Each deployment is intended to retain its own patient records, authentication,
and configuration. Shared branding/code does not imply shared patient access;
custom domains alone do not establish tenant isolation. Supabase Auth and the
app's OAuth endpoints are present;
MCP-compatible authorization and bearer-token data access need the changes
listed in the migration plan.

Before clinic data can be shared, build consent records, installation identity,
authenticated clinic aggregate submission, and aggregate privacy controls,
including protection against identifying someone by comparing releases.
The clinic data exchange receives approved aggregates, not raw patient records.
Public-source ingestion and publishing use separate permissions from personal
records; do not inherit the current reminder worker's service-role access.
Personal exports are a different, private transfer path. Public reports require
their own permissions, separate from study enrollment or clinician sharing.
These are implementation requirements, not claims that federation or its
privacy controls work today.

## Development

Read the shared [repository instructions](../../AGENTS.md) before making changes.
Follow the [repository setup instructions](../../README.md#getting-started).
The app's database access, schema changes and Supabase client guidance are in
the [database guide](supabase/README.md).
Its worker and cron are supporting processes of this app, not separate products.

For UI work, follow the [design system](../../docs/DESIGN-SYSTEM.md), including
its reuse-first workflow and visual/interaction completion checklist. It is the
shared design reference for contributors and agents; extend the existing
landing-page theme and components rather than creating another visual system.

## Environment Setup

The web app requires a PostgreSQL connection (`DATABASE_URL`), an S3-compatible
bucket for uploaded files (`S3_*`) and Supabase credentials for sign-in. Google
AI and Google Cloud credentials are optional and only enable the features that
use those services.

### Local Development

For local development, create a `.env` file in the root of the `apps/web` project (or the monorepo root if configured that way). It should contain at least:

```env
# PostgreSQL connection used by Prisma for all table queries.
# Local Supabase stack: postgresql://postgres:postgres@127.0.0.1:54322/postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase sign-in (Get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET

# S3-compatible bucket for uploaded files. With the local Supabase stack, use its
# S3 endpoint and the S3 keys that `pnpm sb:local:status` prints.
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3
S3_REGION=local
S3_BUCKET=user_uploads
S3_ACCESS_KEY_ID=YOUR_S3_ACCESS_KEY
S3_SECRET_ACCESS_KEY=YOUR_S3_SECRET_KEY
S3_FORCE_PATH_STYLE=true

# Optional: Google Generative AI (for AI-assisted features)
# Get from Google AI Studio: https://aistudio.google.com/app/apikey
# GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GEMINI_API_KEY


# Optional: Other variables like Google OAuth Client ID/Secret if needed
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

```

**Authentication for Google Cloud Locally (Recommended):**

1.  Install the `gcloud` CLI: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2.  Log in with your Google account: `gcloud auth login`
3.  Set up Application Default Credentials (ADC): `gcloud auth application-default login`
    This allows the Google Cloud client libraries to automatically find your credentials when running locally.

### Vercel Deployment

1.  Go to your Vercel Project Settings > Environment Variables.
2.  Add the required variables from your `.env` file: `DATABASE_URL`,
    `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and the `S3_*`
    variables for the file bucket. Add `GOOGLE_GENERATIVE_AI_API_KEY` only when
    AI-assisted features are enabled.
3.  Set the bucket CORS rules to allow `PUT` requests with the `Content-Type`
    and `If-None-Match` headers from the app domains. Browsers upload files directly to the bucket.
