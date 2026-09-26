# Product architecture

**Decision, 2026-09-26:** one configurable dFDA product, with patient, clinic,
researcher, and public interfaces; optional independent installations; and an
optional federated evidence exchange. This is a target architecture, not a claim
that independent installation, tenant isolation, encryption, or federation works
today. See the [inventory](APPS-AND-FEATURES.md) for present code and the
[migration plan](MIGRATION.md#order) for the single implementation sequence.

## One product, several responsibilities

| Responsibility | Product surface | Implementation boundary |
| --- | --- | --- |
| Personal workspace / Digital Twin Safe role | Tracking, imports, treatment reports, study participation, sharing controls | Patient interface in `apps/web`; private records and explicit access grants |
| Clinic Node | Provider workflows and clinic-operated study management | Provider interface in the same codebase; independent installation has its own records, auth, storage, configuration, and credentials |
| Public evidence | Condition/treatment comparisons, source links, reviews, study discovery | Public pages in `apps/web`, reading approved publication views, not unrestricted patient tables |
| Evidence exchange / aggregator | Validate contributions, track provenance, pool compatible estimates, publish releases, administer contributing nodes | App-owned server modules and background jobs initially; a separately operated service only when justified |

The aggregator combines evidence; it is not another required user-facing app.
It also does not automatically receive people's health records. Different
evidence lanes remain distinct, as defined in [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md).
A registry record and its AACT copy are one underlying study, not two sources.

An independently operated evidence exchange should be possible using the same
versioned contracts. A default public index at dfda.earth need not be the only
permitted aggregator. Participation in federation is opt-in; a clinic should
remain useful while disconnected from it.

### Same code does not mean shared custody

- A hosted personal workspace and an independently operated clinic can use the
  same maintained release without sharing a database or accepting each other's
  login tokens automatically.
- A clinician accesses only records authorized for that clinician and purpose.
  Server-side authorization, database policies, storage permissions, jobs, and
  exports must enforce the boundary. Navigation and role labels are not controls.
- Branding, organization membership, login identity, deployment ownership, and
  data access are separate concepts. A custom domain is not a tenant boundary.
- Start with one hosted deployment and later prove one independent clinic
  installation. Do not provision a repository or server for every patient.
  Hosted multi-clinic tenancy requires its own tested isolation design; it is
  not implied by adding an organization ID to tables.
- Personal export and transfer are user-directed. Moving between clinics must
  not require silently transferring an entire organization's records.

### What "Safe" promises

Current patient screens do not establish local-first storage or operator-blind
end-to-end encryption. Describe the initial implementation as a hosted personal
workspace. Retain Digital Twin Safe as the product role, not a security claim.
If user-held keys/local storage become a requirement, specify the threat model,
recovery, sharing, revocation, and computation model before claiming that the
host cannot read data. A dedicated client could share the same domain packages;
it is not a prerequisite for the hosted evidence and study workflows.

## White labeling and independent hosting

Adopt the useful hosted-service/self-hosted-software model: one maintained
release, optional clinic branding, no source fork per customer. This is not a
WordPress implementation or an arbitrary third-party plugin marketplace.

Configuration can select a verified domain, logo/favicon, theme, organization
copy and contacts, enabled modules, and versioned questionnaire/study templates.
Branding cannot change evidence calculations, remove provenance or uncertainty,
imply regulatory endorsement, or bypass consent and publication controls.
Domain resolution and caches must not leak records or branding across tenants.
Extensions begin as reviewed, versioned adapters with explicit permissions.

An installable release must include setup, database migrations, authentication
and redirects, storage, worker/scheduler, email, secrets handling, backups and a
tested restore, upgrades/rollback compatibility, monitoring, and data export.
Demo seeds must be separated from production data. Define a supported version
matrix and security-update procedure before inviting independent operators.

Next.js supports self-hosted Node/container deployments, but shipping the web
server alone does not package those dependencies. Runtime configuration and
multi-instance cache coordination need explicit tests; public build-time values
must not be mistaken for per-install runtime secrets. See the
[official self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting).

## Repository ownership

Only `apps/web` is the top-level product app today. The locations below are the
targets for new modules/packages, not existing directories unless the inventory
marks them present. Extract reusable code when its first feature ships; do not
create empty packages just to match this table.

| Location | Owns |
| --- | --- |
| `apps/web/app` | Existing public, patient, provider, researcher, and admin routes; extend these instead of duplicating sites |
| `apps/web/lib/evidence` | Source access adapters (including approved Reddit ingestion), review workflow, persistence, score/publication orchestration; calls shared parsers and methods |
| `apps/web/lib/studies` | Study wizard, eligibility, consent/enrollment state machine, protocol review and publication; reuse existing trial/enrollment actions and tables where appropriate |
| `apps/web/lib/instance` | Validated branding/module configuration and operator administration |
| `apps/web/lib/data-export` | Authorized personal export/import orchestration and transfer audit |
| `apps/web/worker` and `apps/web/cron-enqueuer.ts` | Durable ingestion, refresh, validation, analysis, publication, deletion propagation, and reminders; supporting processes, not separate products |
| `apps/web/supabase/migrations` | Canonical SQL schema, access policies, and publication views; no new canonical database package |
| `packages/codebook` | Versioned IDs, terminology mappings, units, outcome direction, and mapping review status |
| `packages/evidence` | Source/report/effect/release contracts, validators, provenance and deduplication primitives; no credentials or database access |
| `packages/trials` | ClinicalTrials.gov/AACT adapters and parsing, trial discovery, public study-protocol contract |
| `packages/analysis` | Deterministic descriptive scores, N-of-1 analysis, study-effect estimation, compatible meta-analysis and uncertainty; tested methods, not source fetching |
| `packages/importers` | Wearable/app export parsing and personal-data export contract, not a central OAuth token store |
| `packages/summary-file` | Clinic aggregate exchange contract and validators; never the format for public comments or personal record transfer |

Dependency direction: `codebook` is foundational; `evidence` uses its identifiers;
`trials`, `analysis`, `importers`, and `summary-file` may consume shared contracts;
app modules compose them. Shared packages do not import app actions or one
another cyclically. Wire contracts have one owner, not duplicated validators in
each deployment.

Long-running ingestion belongs in jobs, not a page request. The current worker
uses a Supabase service-role client; this is **not** the target trust boundary
for an untrusted-source ingestion or public publishing job. Separate queues,
process credentials, restricted database roles, and explicit publication views
must prevent those jobs from reading private patient records. The same repo can
produce multiple restricted processes without becoming multiple product apps.

Split an aggregator service when independent operators, restricted credentials,
failure isolation, or scaling require it. Do not wait for scale to enforce data
isolation. No `apps/aggregator` directory or central patient database is required
by this plan.

## First useful product

A person can compare the separate evidence lanes for a treatment/condition,
open original sources, contribute a structured report, track their outcomes,
and discover or propose a study. Complete that hosted loop first. Then prove a
branded clinic install and its opt-in aggregate contribution using the same
contracts. The [roadmap gates](MIGRATION.md#order) determine when each is ready.
