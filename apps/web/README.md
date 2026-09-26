# dFDA web app

`apps/web` is the canonical Next.js/Supabase product application.
`prototype.dfda.earth` is its reference deployment. The same codebase is
intended to serve the public site and personal workspaces at `dfda.earth`, or
run independently at a clinic as a branded Clinic Node. One maintained release,
not a fork per clinic. The domain cutover, independently installable Clinic Node,
and federation are still planned; patient screens alone do not implement a
local-first or operator-blind encrypted Digital Twin Safe.

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

- Public pages, patient tracking, provider and research-partner workflows,
  administration, and developer access belong to this app.
- Reusable analysis, trial-data ingestion, codebook, evidence contracts, export
  parsers, and aggregate Summary File validation belong to the planned shared packages.
- Source access/review/publication belongs in `lib/evidence`; study lifecycle
  orchestration in `lib/studies`; branding in `lib/instance`; authorized personal
  export orchestration in `lib/data-export`. These modules are planned, not present.
- Third-party connections and OAuth/data imports remain app capabilities.
  Export parsers are only part of that work; connection authorization and
  token handling still need design and implementation.
- Node registration, authenticated submissions, network monitoring, and
  contribution policies belong to the planned evidence exchange's administration.
  Start with app-owned modules and restricted jobs, not another product website.
  Separate processes/services when needed for isolation or operations.
- Existing AI-assisted capture and chat code remains. Parsing a person's
  input is distinct from generating medical evidence; published evidence
  must follow the migration plan's provenance and no-AI-numbers rules.

## Data and access boundaries

Each deployment is intended to retain its own patient records, authentication,
and configuration. Shared branding/code does not imply shared patient access;
custom domains alone do not establish tenant isolation. Supabase Auth and the
app's OAuth endpoints are present;
MCP-compatible authorization and bearer-token data access need the changes
listed in the migration plan.

Before clinic data can be shared, build consent records, node identity,
authenticated Summary File submission, and aggregate privacy controls,
including protection against identifying someone by comparing releases.
The clinic exchange receives approved aggregates, not raw patient records.
Public-source ingestion and publishing use separate permissions from personal
records; do not inherit the current reminder worker's service-role access.
Personal exports are a different, private transfer path. Public reports require
their own permissions, separate from study enrollment or clinician sharing.
These are implementation requirements, not claims that federation or its
privacy controls work today.

## Development

Follow the [repository setup instructions](../../README.md#getting-started).
The app's database configuration and migrations are in [supabase](supabase).
Its worker and cron are supporting processes of this app, not separate products.

## Environment Setup

The web app requires Supabase credentials. Direct Postgres, Google AI, and
Google Cloud credentials are optional and only enable the features that use
those services.

### Local Development

For local development, create a `.env` file in the root of the `apps/web` project (or the monorepo root if configured that way). It should contain at least:

```env
# Supabase (Get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET

# Optional: Google Generative AI (for AI-assisted features)
# Get from Google AI Studio: https://aistudio.google.com/app/apikey
# GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GEMINI_API_KEY


# Optional: Other variables like Google OAuth Client ID/Secret if needed
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Optional: Database connection string if needed directly by ORM/scripts
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-SUPABASE-ID].supabase.co:5432/postgres"
```

**Authentication for Google Cloud Locally (Recommended):**

1.  Install the `gcloud` CLI: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2.  Log in with your Google account: `gcloud auth login`
3.  Set up Application Default Credentials (ADC): `gcloud auth application-default login`
    This allows the Google Cloud client libraries to automatically find your credentials when running locally.

### Vercel Deployment

1.  Go to your Vercel Project Settings > Environment Variables.
2.  Add the required Supabase variables from your `.env` file:
    `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. Add
    `GOOGLE_GENERATIVE_AI_API_KEY` only when AI-assisted features are enabled.
