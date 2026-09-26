# Product architecture

**Decision, 2026-09-26:** one configurable dFDA product, with patient, clinic,
researcher, and public interfaces; optional independent installations; and an
optional federated clinic data exchange. This is a target architecture, not a claim
that independent installation, tenant isolation, encryption, or federation works
today. See the [inventory](APPS-AND-FEATURES.md) for present code and the
[migration plan](MIGRATION.md#order) for the single implementation sequence.

**Immediate purpose:** an understandable, useful demo of the intended product.
Keep AI-generated estimates and illustrative content with clear origin labels;
progressively improve them with better sources and methods. Complete clinical
validation is not a prerequisite for showing the demo. The
[estimate policy](EVIDENCE-AND-EXCHANGE.md#demo-estimates-and-progressive-improvement)
separates provisional best estimates, example data and source-backed results.

**Functional target:** reproduce the useful app powered by curedao-api, including
tracking/imports, reminders, predictor search, personal/population time-series
analyses, charts and generated study reports, then improve it. These data-derived
studies belong in the product as observational findings, not just a separate
archive. The [reference baseline](MIGRATION.md#what-comes-from-curedao-api) owns
parity requirements, numerical corrections and legacy continuity gates.

## Naming guide

Use names that describe a person's workspace, the data, or the operation. These
are responsibilities within one product, not a list of separate apps.

| Name | Meaning |
| --- | --- |
| Personal health workspace | A person's tracking, imports, reports and sharing controls |
| Clinic workspace | The provider/team interface for authorized patient and study work |
| Independent installation | A separately operated copy of the same product, with its own configuration, auth and records |
| Health vocabulary (`packages/health-vocabulary`) | Shared IDs, names, aliases, units and cross-source mappings for conditions, treatments and outcomes |
| Evidence pipeline | Import, normalize, review, analyze and publish sources and estimates |
| Clinic data exchange | Optional authenticated sharing of approved clinic aggregates between installations |
| Clinic aggregates (`packages/clinic-aggregates`) | Group-level clinic statistics and their validation rules, represented by `ClinicSummary`; not raw patient records |
| Evidence types | Distinct categories such as patient reports, community reports and clinical study results; separate from example/model/source-backed origin |
| Time-series analysis (`TimeSeriesAnalysis`) | A versioned result calculated from recorded measurements, with methods, lineage and reproduction status; personal or population observational scope |
| Published analysis version (`PublishedAnalysisVersion`) | A dated, versioned set of analysis results, methods and input references |

For example, the health vocabulary can map "hours slept" and "sleep duration" to
one outcome while preserving source units and defining supported conversions.
It is shared data/logic, not another application. Units alone do not make different
outcomes equivalent; mappings retain context and review status.

`ModelEstimate` means a provisional model-generated number; `DemoExample` means
synthetic data used to demonstrate a feature. Neither is an observed study result.
Automatically fitting a model to recorded data does not make the result a
`ModelEstimate`: data-derived time-series findings use `TimeSeriesAnalysis`, with
their assumptions and limitations. Generated report prose does not change origin.
Trial search, treatment ratings, study protocol and Outcome Label keep their names.
The proposed package/type names have not shipped; this cleanup does not rename
runtime code, database fields or external URLs.

## One product, several responsibilities

| Responsibility | Product surface | Implementation boundary |
| --- | --- | --- |
| Personal health workspace | Tracking/imports, history/charts, predictor search, personal analyses/reports, reminders, study participation and sharing controls | Patient interface in `apps/web`; private records and explicit access grants |
| Clinic workspace | Provider workflows and clinic-operated study management | Provider interface in the same codebase; independent installation is an optional hosting choice, not a separate interface/app |
| Public demo and evidence | Condition/treatment comparisons, authorized observational study reports/charts, labeled estimates/examples, source links, reviews and study discovery | Public pages in `apps/web`, reading publication views that preserve data origin and historical/reproduced/corrected status, not unrestricted patient tables |
| Evidence pipeline | Import sources, track provenance, review estimates, analyze compatible inputs and publish results | App-owned server modules and restricted jobs; works without clinic data sharing |
| Clinic data exchange | Register contributing installations, authenticate aggregate submissions and track corrections/withdrawals | Optional app-owned administration and restricted receiving jobs; accepted data enters the evidence pipeline |

The evidence pipeline processes evidence; it is not another required user-facing
app and does not require a clinic data exchange. The exchange does not automatically
receive people's health records. Different
evidence types remain distinct, as defined in [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md).
A registry record and its AACT copy are one underlying study, not two sources.

An independently operated clinic data exchange should be possible using the same
versioned contracts. A default public index at dfda.earth need not be the only
permitted exchange operator. Participation in federation is opt-in; a clinic should
remain useful while disconnected from it.

### Same code does not mean shared custody

- A hosted personal health workspace and an independently operated clinic can use the
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

### Personal health workspace and storage guarantees

Current patient screens do not establish local-first storage or operator-blind
end-to-end encryption. Describe the initial implementation as a hosted personal
health workspace, not a digital twin or an encrypted vault.
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
Demo seeds and model estimates may populate public demo views, but remain labeled
and separate from actual patient/study records and empirical analysis inputs.
Define a supported version
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
| `apps/web/lib/evidence` | Source access adapters (including legacy study imports and approved Reddit ingestion), estimate generation/import and revision, analysis orchestration, review, persistence and publication; calls shared parsers/methods and renders approved result projections |
| `apps/web/lib/evidence/import` | Planned shared validate/preview/apply/status service, manifest handling, batch audit/replay protection and publication-policy enforcement; CLI, MCP and admin/API clients call the same service |
| `apps/web/data/demo` | Planned versioned JSON/JSONL demo packs with explicit per-record origins; only non-sensitive, Git-redistributable content, not private patient records or restricted source payloads |
| `apps/web/lib/studies` | Study wizard, eligibility, consent/enrollment state machine, protocol review and publication; reuse existing trial/enrollment actions and tables where appropriate |
| `apps/web/lib/instance` | Validated branding/module configuration and operator administration |
| `apps/web/lib/data-export` | Authorized personal export/import orchestration and transfer audit |
| `apps/web/worker` and `apps/web/cron-enqueuer.ts` | Durable ingestion, refresh, validation, analysis, publication, deletion propagation, and reminders; supporting processes, not separate products |
| `apps/web/supabase/migrations` | Canonical SQL schema, access policies, and publication views; no new canonical database package |
| `packages/health-vocabulary` | Versioned IDs, terminology mappings, units, outcome direction, and mapping review status |
| `packages/evidence` | Source/report/time-series-analysis/effect/model-estimate/demo-example/published-analysis-version contracts, validators, provenance and deduplication primitives; no credentials or database access |
| `packages/trials` | ClinicalTrials.gov/AACT adapters and parsing, trial discovery, public study-protocol contract |
| `packages/analysis` | Deterministic personal/population time-series calculations, descriptive scores, study-effect estimation, compatible meta-analysis and uncertainty; curedao-api reference methods plus reviewed TypeScript ports/improvements, tested independently of source fetching |
| `packages/importers` | Wearable/app export parsing and personal-data export contract, not a central OAuth token store |
| `packages/clinic-aggregates` | Clinic aggregate exchange contract and validators; never the format for public comments or personal record transfer |

Dependency direction: `health-vocabulary` is foundational; `evidence` uses its identifiers;
`trials`, `analysis`, `importers`, and `clinic-aggregates` may consume shared contracts;
app modules compose them. Shared packages do not import app actions or one
another cyclically. Wire contracts have one owner, not duplicated validators in
each deployment.

Use the planned MCP surface for narrowly scoped evidence tools as well as the
separate tracking tool group. CLI imports, agents and the admin/browser interface
share the same ingestion service and authorization checks; there is no agent-only
database shortcut. Evidence submission does not grant publication or personal-data
access. Files/importer ship before MCP/admin adapters. The
[data-population specification](EVIDENCE-AND-EXCHANGE.md#populate-data-through-files-mcp-and-the-admin-ui)
owns operation names, origins, preview/retry semantics and publication controls;
the [roadmap](MIGRATION.md#order) owns their delivery order.

Long-running ingestion belongs in jobs, not a page request. The current worker
uses a Supabase service-role client; this is **not** the target trust boundary
for an untrusted-source ingestion or public publishing job. Separate queues,
process credentials, restricted database roles, and explicit publication views
must prevent those jobs from reading private patient records. The same repo can
produce multiple restricted processes without becoming multiple product apps.

Split evidence-pipeline or clinic-data-exchange services when independent operators, restricted credentials,
failure isolation, or scaling require it. Do not wait for scale to enforce data
isolation. No additional top-level app or central patient database is required by
this plan.

## First useful product

A visitor first sees a coherent demo, including labeled current best estimates
where source-backed coverage is incomplete and explicit examples of planned flows.
Reproduce the legacy loop: import/log data, inspect history/charts, find predictors,
open personal and permitted population studies, read/share/export reports and keep
tracking with reminders. Import useful historical findings with explicit status
while verifying the new calculations. Extend that loop so a person can compare
separate evidence types, open original sources, contribute a structured report,
and discover or propose a study. Mark
simulated versus working interactions; live patient/study use retains its access,
consent and review gates. Then prove a
branded clinic install and its opt-in aggregate contribution using the same
contracts. The [roadmap gates](MIGRATION.md#order) determine when each is ready.
