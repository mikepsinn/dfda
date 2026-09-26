# Apps, packages, and feature inventory

Inventory updated: 2026-09-26. Local app/layout checked against `mikepsinn/dfda`
master at `0b47d07f`; external extraction findings remain historical, not a new
audit of every source repository. See the [migration plan](MIGRATION.md) and the
[`fda-gov-v2` extraction checklist](fda-gov-v2-retirement.md).

There is one tracked top-level product app today: `apps/web`. The repository
uses pnpm workspaces (`apps/*` and `packages/*`), with no Git submodules.
The Digital Twin Safe and Clinic Node are intended uses of the same app.
The [product architecture](PRODUCT-ARCHITECTURE.md) defines hosted/independent
deployment, branding and access boundaries. [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md)
defines source destinations, scores, study flows and versioned contracts.

Status meanings:

- **Present:** code or screens exist here; this inventory is not an end-to-end verification of each feature.
- **To extract:** selected behavior or data is intended to move from another repository.
- **To build:** new work required by the migration plan.
- **Candidate:** requires a port, reject, or defer decision.

## Current application and its features

[`apps/web`](../apps/web) is the canonical Next.js/Supabase app, formerly
`apps/dfda-node`. Its reference deployment is `prototype.dfda.earth`; taking
over `dfda.earth` is a later migration step.

| Area | Present features and screens | Remaining work / limitation |
| --- | --- | --- |
| Public site | Landing page; condition, treatment, outcome-label, trial-search, provider, contact, privacy, and terms pages | Replace demo and AI-generated evidence; add source-linked, separate community, patient, research and later clinic evidence. Evaluate richer public UI from `fda-gov-v2`. |
| Patient / Digital Twin Safe | Onboarding, conditions, symptom severity, treatments, 0–10 treatment ratings, side effects, measurements, variables, reminders, profile, and trial participation screens | Data imports, personal analysis, consent, and migration of existing users' records need more work. The Safe is a product role; these screens do not establish that encrypted local storage is complete. |
| Provider / Clinic Node | Provider dashboard, patient list and enrollment, intervention assignment, EHR authorization, and form creation screens | Packaging for independent clinic installation and aggregate-data sharing are still planned. |
| Research partner | Dashboard, trial creation, enrollment actions, and trial-results screens | Build/verify protocol versions, review gates, consent, eligibility, withdrawal and study lifecycle. Existing create/enroll actions do not establish these safeguards. |
| Admin | Admin dashboard and role-selection screens | Broader instance administration and network management remain incomplete. |
| Authentication and developer access | Supabase sign-in, password reset, OAuth authorization and token endpoints, developer OAuth-client management, developer documentation, and `/api/openapi` | MCP needs dynamic client registration, standard discovery metadata, form-encoded token requests, and bearer-token database access. |
| AI-assisted capture and chat | Image analysis and measurement-saving actions; chat and CopilotKit routes | Text-to-measurement logging is to be extracted. The evidence rules prohibit AI-generated medical numbers, not parsing a person's own input. |

## Existing supporting components

| Path | Purpose | Status |
| --- | --- | --- |
| [`apps/web/worker`](../apps/web/worker) | Graphile Worker background jobs | Present; a separate process belonging to the web app |
| [`apps/web/cron-enqueuer.ts`](../apps/web/cron-enqueuer.ts) | Scheduled-job enqueueing | Present; a separate process belonging to the web app |
| [`apps/web/agent`](../apps/web/agent) | LangGraph/CopilotKit agent project, with its own package manifest | Present; nested project, not a separate top-level product app |
| [`apps/web/sdks/dfda-js-sdk`](../apps/web/sdks/dfda-js-sdk) | JavaScript SDK | Present; nested package |
| [`apps/web/supabase`](../apps/web/supabase) | App database configuration and SQL migrations | Present; canonical app migrations live here |
| [`packages/legacy-import`](../packages/legacy-import) | Legacy MySQL Prisma schema, query tools, and MySQL-to-PostgreSQL sync | Present; replaces `packages/database` and `packages/db-ops`; retire after migration |
| [`packages/config-eslint`](../packages/config-eslint) | Shared lint configuration | Present |
| [`packages/config-typescript`](../packages/config-typescript) | Shared TypeScript configuration | Present |
| [`supabase`](../supabase) and [`schema`](../schema) | Additional database schema definitions and tooling | Present; compare with app migrations before reuse |
| [`pulumi-infra`](../pulumi-infra) | GCP, Cloud Run, and Coolify/Supabase provisioning code | Present; code presence does not establish an active deployment |

The nested agent/SDK and root infrastructure directories are not additional
workspace roots matched by the current `apps/*` and `packages/*` patterns.

## Repositories and what comes from each

These are the documented extraction sources, not a fresh audit of every source
repository's latest commit. The main migration plan covers the first four;
`fda-gov-v2` has its own checklist.

| Repository | Role | Features or data to bring into dFDA |
| --- | --- | --- |
| [`mikepsinn/dfda`](https://github.com/mikepsinn/dfda) | Canonical destination; formerly `decentralized-fda/decentralized-fda` | Keep developing `apps/web` and add the shared packages below. |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | Tracking integration, analysis, and importer source | dFDA MCP tools; tracking REST API and OpenAPI; ClinicalTrials.gov search client; N-of-1 analysis from `packages/optimizer`; wearable/app parsers; condition names and ICD-10 codes; selected landing/about/FAQ copy; relevant tests. |
| [`mikepsinn/crowdsourcing-cures`](https://github.com/mikepsinn/crowdsourcing-cures) (private) | Patient-rating UI and text logging source | Treatment rankings by condition, a treatment's ratings across conditions, and text-to-measurement logging rewired to this app's tables. Organization pages remain on crowdsourcingcures.org. |
| [`mikepsinn/curedao-api`](https://github.com/mikepsinn/curedao-api) (private) | Legacy PHP/AngularJS system and MySQL data | Patient ratings from `ct_*` tables, variable definitions for the codebook, and consenting users' measurement history. The generated studies site remains an archive. |
| [`mikepsinn/fda-gov-v2`](https://github.com/mikepsinn/fda-gov-v2) | Additional UI and capture candidates | Landing/evidence presentation; public search and condition details; richer trial-search UI; image/nutrition-label/webcam capture and review; configurable logo/favicon. |

ClinicalTrials.gov/AACT is an additional **data source**, not another app or
repository to merge. Build ingestion of posted results, starting with adverse
events and comparisons between treatment and comparison groups.

### External and first-party evidence sources

All rows below describe planned ingestion/publication, not verified live pipelines.

| Source | Destination | Required distinction |
| --- | --- | --- |
| Reddit / permitted public discussions | App evidence adapters and review queue; source-linked community reports on existing condition/treatment pages | Access/processing approval first; anecdotes are not enrolled patients or clinical effect estimates |
| ClinicalTrials.gov API v2 / AACT | `packages/trials` -> normalized study/effect records -> trial search and evidence pages | Registry discovery versus posted results; deduplicate the same NCT study across transports |
| Papers and existing reviews/meta-analyses | Evidence review/extraction -> cited research and versioned synthesis releases | Trace underlying studies; never pool a review alongside its constituent trials |
| Patient treatment ratings and study follow-ups | Existing patient/rating/measurement storage extended with report context, permissions and protocol versions | Private by default; authorized reports/aggregates stay separate from trials and comments |
| Independent clinic contributions | `packages/summary-file` -> validated evidence-exchange submissions | Approved aggregates only, with tested privacy/overlap controls |

The [source/storage map and contracts](EVIDENCE-AND-EXCHANGE.md) also cover
personal-data exports, corrections/withdrawals, provenance and analysis releases.

### Extraction checklist

Unchecked items below are planned or awaiting acceptance, not confirmed complete.

From Optimitron:

- [ ] Port the dFDA MCP measurement, reminder, and notification tools into `/api/mcp` over this app's data layer.
- [ ] Port the tracking REST API for measurements, reminders, notifications, and variables, with its OpenAPI document.
- [ ] Extract the tested ClinicalTrials.gov search client into `packages/trials` and connect the existing trial-search page.
- [ ] Extract N-of-1 analysis into `packages/analysis`. Recheck and resolve the migration plan's reported small-sample p-value and effect-direction ranking problems before adoption.
- [ ] Extract wearable/app export parsers into `packages/importers`.
- [ ] Use condition names and ICD-10 codes in `packages/codebook`.
- [ ] Adapt selected landing/about/FAQ content and bring relevant tests with the moved features.

From Crowdsourcing Cures and the legacy API:

- [ ] Replace demo ranking data with the patient-rating dataset and corresponding condition/treatment ranking views.
- [ ] Port text-to-measurement logging alongside the existing image capture actions.
- [ ] Map legacy variables, app seeds, and condition codes into the shared codebook.
- [ ] Implement consent and migration for personal measurements held by curedao-api or Optimitron.

From `fda-gov-v2` (candidates):

- [ ] Review the landing page's evidence comparison table, source list, patient/researcher explanations, and sticky navigation.
- [ ] Review public search, condition-to-intervention evidence cards, citations, and readable condition URLs.
- [ ] Review trial-search suggestions, filters, results display, and schemas; reconcile UI improvements with the Optimitron search client selected by the migration plan.
- [ ] Review image-to-measurements, nutrition-label parsing, webcam capture, and the review wizard against capture code already present here.
- [ ] Review configurable logo and favicon settings for independently branded nodes.

Record each candidate as ported, rejected, or deferred before archiving
`fda-gov-v2`. Its checklist records an audit of `develop` at `cf29035c`;
that is a historical audit, not a claim about its current head.

## Planned packages and product features

These package directories do not yet exist in the inventoried master tree.

| Planned package | Features | Starting point |
| --- | --- | --- |
| `packages/analysis` | Descriptive scores, N-of-1 analysis, study-effect estimation and compatible meta-analysis | Extract selected Optimitron optimizer code, resolve reported correctness issues, and build/test missing methods |
| `packages/trials` | Trial search, posted-results ingestion, group comparisons, adverse-event rates, NCT-linked evidence and study-protocol contract | Extract search client; build results parser, protocol contract and optional bulk AACT adapter |
| `packages/codebook` | Stable names/IDs for conditions, treatments, outcomes, and units; outcome direction and mapping | Reconcile legacy variables, app seeds, and Optimitron condition codes |
| `packages/evidence` | Shared source, community/patient report, study-effect, analysis-release and withdrawal contracts; provenance/deduplication primitives | New; app owns fetching, review workflow and persistence |
| `packages/importers` | Wearable/app parsing and personal-data export contract | Extract Optimitron parsers already ported from legacy PHP connectors; add portable export format |
| `packages/summary-file` | Aggregate-only clinic exchange format and validators | New work shared by Clinic Nodes and evidence exchanges; not a personal-record or comment format |

| Product component | Features still to build | Intended location |
| --- | --- | --- |
| Community evidence | Permitted source adapters, source-linked extraction/review, separate scores, corrections and deletion propagation | `apps/web/lib/evidence`, existing worker and planned evidence/analysis packages |
| Create/join studies | Personal tracking, observational protocols and interventional proposals; versioned review/consent/enrollment flow | `apps/web/lib/studies` extending current trial/enrollment actions and UI |
| Installable branded Clinic Node | Configuration, independent operations, tested backup/restore/upgrades and data portability; opt-in federation later | Same `apps/web` release, `lib/instance` and deployment packaging; no fork per clinic |
| Evidence exchange / aggregator | Node identity, authenticated submissions, monitoring, validation, compatible analysis and publication | App-owned modules and restricted worker processes initially; optional later service, not a required separate product app |
| Clinical-record analysis | Treatment-effect estimation from clinical records, beyond existing within-person correlations | New analysis work |
| Evidence publication | Provenance labels, outcome direction, uncertainty intervals, ranking eligibility, and separation of patient-reported, trial-reported, and clinic evidence | Public pages backed by the shared packages; detailed rules remain in [MIGRATION.md](MIGRATION.md#rules-for-published-numbers) |

Third-party OAuth connections and data imports remain capabilities of
`apps/web`; `packages/importers` covers export parsing, not a complete connection
service. Connection authorization and token handling need their own design.
Public and marketing pages remain in `apps/web`. Network administration belongs
to the evidence exchange; these capabilities do not require additional product
apps. The current service-role reminder worker is not a safe default credential
boundary for source ingestion or public publication.

## Features excluded or retired

- `apps/crowdsourcing-cures` and experimental `apps/fdai` were removed from this repository. The standalone Crowdsourcing Cures repository remains separate.
- `apps/dfda-node` was renamed to `apps/web`. Local caches or data left under the old path are not another tracked app.
- The old `mathematical-modeling`, `autonomous-researcher`, `link-checker`, `deployer`, and `gcp-setup` packages were removed. They are not prerequisites for the new package list.
- Optimitron's AI-estimated medical numbers and condition/treatment pages are excluded. Its old trial-results parser is also excluded; the migration plan calls for a new parser.
- Optimitron keeps shared `tracking`, `db`, and `data` packages used by its other sites, its own MCP server, and economic-model constants. Extract the selected functionality rather than moving those entire packages.
- Crowdsourcing Cures keeps its organization pages. Legacy-data proxy pages are removed during cutover; variable charts and predictor search are rebuilt later on `analysis`. AI-written evidence pages, drug registration, and the muscle-mass cost-benefit page are not extraction targets.
- Referendum voting is optional public advocacy functionality, not a required clinic module.

## Sequence and migration dependencies

Follow the single [delivery sequence and exit gates](MIGRATION.md#order): the
hosted evidence/reporting/study loop comes before independent clinic installation
and optional federation. Community access approval is not a dependency for
first-party reporting or ClinicalTrials.gov discovery. Living meta-analysis does
not have to wait for clinic recruitment.

Before the domain moves, disentangle OAuth accounts/tokens, users' tracking
data, and Optimitron's shared `no-reply@updates.dfda.earth` sender. Existing MCP
connectors will need to reconnect to the new authorization server. The
[migration plan](MIGRATION.md#what-comes-from-optimitron) describes a temporary
API-forwarding option if the public pages move first.

The unresolved user-data decision is how to request migration consent and what
to do when users do not respond. No data transfer is implied by this inventory.
