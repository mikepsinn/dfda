# Apps, packages, and feature inventory

Inventory updated: 2026-09-26. Local app/layout checked against `mikepsinn/dfda`
master at `0b47d07f`; curedao-api's reference workflows were inspected at
`47ea2bcc` for the [legacy feature baseline](MIGRATION.md#what-comes-from-curedao-api).
Other external extraction findings remain historical, not a new audit of every
source repository. See the [migration plan](MIGRATION.md) and the
[`fda-gov-v2` extraction checklist](fda-gov-v2-retirement.md).

Targeted local recheck, 2026-09-27 at `49e649e13`: the app/package layout still
matches the distinction between present screens and planned evidence/import
modules below. This was not a new external-repository or live-workflow audit.
The [current priorities and to-do list](MIGRATION.md#current-priorities-and-to-do-list)
records the demo-first execution order and current verification results. History consolidation is
parked; current product quality is the priority.

Implementation, 2026-09-27 (deployment not verified): `/treatment-rankings`
and `/outcome-labels/demo/[conditionSlug]/[treatmentSlug]` display the medical
dataset forked from Optimitron: 1,214 comparisons across all 216 conditions. All 221 source
files were copied intact, including the 969-entry treatment catalog, 536-entry
reference collection and all dose/cost/citation metadata. Sortable estimate scores, primary/secondary outcomes, side effects,
origin labels, source links and external trial discovery are present. These are
mostly unverified AI estimates, not patient ratings or verified clinical results; values
corrected against primary sources are logged in `corrections.json`. The
[dataset notes](../apps/web/data/optimitron/README.md) describe its origin, the correction
process and remaining redistribution review. The former 19-comparison projection
was replaced, not retained as a second dataset. Condition/synonym search, comparison
cards, the existing landing-page Outcome Label renderer, annual cost breakdowns,
expandable cost-effectiveness details and snapshot regimens now use the shared
UI primitives; see [UI conventions](DESIGN-SYSTEM.md). Additional metadata displays
and cross-condition catalog/reference pages still need integration. No patient database migration,
general-purpose importer, MCP tool or clinical evidence validation is implied.

The suvorexant/insomnia Outcome Label also displays one separately sourced
ClinicalTrials.gov comparison from NCT01097616: a posted between-group effect,
confidence interval, endpoint-specific participant counts and original results
link. Its bounded API importer and source fixture are documented in the
[trial snapshot notes](../apps/web/data/evidence/README.md). It is not a pooled
meta-analysis; ranking scores remain provisional and unchanged.

There is one tracked top-level product app today: `apps/web`. The repository
uses pnpm workspaces (`apps/*` and `packages/*`), with no Git submodules.
The personal health workspace and clinic workspace are interfaces in the same app;
an independent installation is a hosting choice, not another product.
The [product architecture](PRODUCT-ARCHITECTURE.md) defines hosted/independent
deployment, branding and access boundaries. [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md)
defines source destinations, scores, study flows and versioned contracts.

The immediate priority is a useful demo with clearly labeled current best estimates,
then progressive improvement with better data. AI-generated content is not excluded
by origin; example data, provisional estimates and source-backed results remain distinct.
The functional target is to reproduce the useful curedao-api app, including its
personal/population time-series studies, then improve it. Existing generated
studies based on recorded measurements are observed-data analyses, not demo filler.

Status meanings:

- **Present:** code or screens exist here; this inventory is not an end-to-end verification of each feature.
- **To extract:** selected behavior or data is intended to move from another repository.
- **To build:** new work required by the migration plan.
- **Candidate:** requires a port, reject, or defer decision.

## Current application and its features

[`apps/web`](../apps/web) is the canonical Next.js app (PostgreSQL through Prisma,
files in an S3-compatible bucket, sign-in with Better Auth), formerly
`apps/dfda-node`. Its reference deployment is `prototype.dfda.earth`; taking
over `dfda.earth` is a later migration step.

| Area | Present features and screens | Remaining work / limitation |
| --- | --- | --- |
| Public site | Landing page; condition, treatment, outcome-label, trial-search, provider, contact, privacy, and terms pages | Preserve and label the demo/AI estimates; improve them progressively with source-linked community, patient, research and later clinic evidence. Evaluate richer public UI only when useful. |
| Personal health workspace | Onboarding, conditions, symptom severity, treatments, 0–10 treatment ratings, side effects, measurements, variables, reminders, profile, and trial participation screens | Reproduce legacy tracking/imports, reminder behavior, predictor search, charts and personal studies; verify consent and user-directed migration. Present screens do not establish behavioral parity, local-first or operator-blind encrypted storage. |
| Clinic workspace | Provider dashboard, patient list and enrollment, intervention assignment, EHR authorization, and form creation screens | Packaging for an independent installation and aggregate-data sharing are still planned; this row describes the provider interface, not a separate app. |
| Research partner | Dashboard, trial creation, enrollment actions, and trial-results screens | Build/verify protocol versions, review gates, consent, eligibility, withdrawal and study lifecycle. Existing create/enroll actions do not establish these safeguards. |
| Admin | Admin dashboard and role-selection screens | Broader instance administration and network management remain incomplete. |
| Authentication and developer access | Better Auth sign-in (magic link, Google, password), password reset, organizations, an OAuth 2.1 / OpenID Connect provider with dynamic client registration and discovery metadata, developer OAuth-client management, developer documentation, and `/api/openapi` | An MCP server and bearer-token data access are still to be built. |
| AI-assisted capture and chat | Image analysis and measurement-saving actions; chat and CopilotKit routes | Text-to-measurement logging is to be extracted. Parsing a person's input and generating provisional estimates remain distinct; estimates need origin labels and must not become observed patient/study records. |

## Existing supporting components

| Path | Purpose | Status |
| --- | --- | --- |
| [`apps/web/worker`](../apps/web/worker) | Graphile Worker background jobs | Present; a separate process belonging to the web app |
| [`apps/web/cron-enqueuer.ts`](../apps/web/cron-enqueuer.ts) | Scheduled-job enqueueing | Present; a separate process belonging to the web app |
| [`apps/web/agent`](../apps/web/agent) | LangGraph/CopilotKit agent project, with its own package manifest | Present; nested project, not a separate top-level product app |
| [`apps/web/db`](../apps/web/db) and [`apps/web/prisma`](../apps/web/prisma) | App SQL migrations, seeds, bootstrap SQL, database guide and Prisma schema | Present; canonical app migrations live in `apps/web/db/migrations` |
| [`docker-compose.yml`](../docker-compose.yml) | Local PostgreSQL, Mailpit and S3 test server for development | Present |
| [`packages/legacy-import`](../packages/legacy-import) | Legacy MySQL Prisma schema, query tools, and MySQL-to-PostgreSQL sync | Present; replaces `packages/database` and `packages/db-ops`; retire after migration |
| [`packages/config-eslint`](../packages/config-eslint) | Shared lint configuration | Present |
| [`packages/config-typescript`](../packages/config-typescript) | Shared TypeScript configuration | Present |
| [`schema`](../schema) | Earlier, unapplied database schema design | Present; compare with app migrations before reuse |

The nested agent directory is not an additional
workspace root matched by the current `apps/*` and `packages/*` patterns.

## Repositories and what comes from each

These are the documented extraction sources; the targeted curedao-api review is
not an exhaustive audit of each repository or live feature. The main migration
plan covers the first four;
`fda-gov-v2` has a completed retirement audit and explicit reuse decisions.

| Repository | Role | Features or data to bring into dFDA |
| --- | --- | --- |
| [`mikepsinn/dfda`](https://github.com/mikepsinn/dfda) | Canonical destination; formerly `decentralized-fda/decentralized-fda` | Keep developing `apps/web` and add the shared packages below. |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | Tracking integration, analysis, estimate/content and importer source | dFDA MCP tools; tracking REST API and OpenAPI; ClinicalTrials.gov search client; N-of-1 analysis from `packages/optimizer`; wearable/app parsers; condition names and ICD-10 codes; useful condition/treatment content and AI estimates with provenance labels; selected landing/about/FAQ copy; relevant tests. |
| [`mikepsinn/crowdsourcing-cures`](https://github.com/mikepsinn/crowdsourcing-cures) (private) | Patient-rating UI, demo content and text logging source | Treatment rankings by condition, a treatment's ratings across conditions, text-to-measurement logging rewired to this app's tables, and selected AI-written analyses as labeled drafts/estimates to improve. Organization pages remain on crowdsourcingcures.org. |
| [`mikepsinn/curedao-api`](https://github.com/mikepsinn/curedao-api) (private) | Functional reference for the replacement app; PHP/AngularJS system and MySQL data | Reproduce tracking/imports, reminders/connectors, predictor/outcome search, charts, personal/population calculations and generated reports. Bring eligible study results, `ct_*` ratings, variables and user-authorized measurements with provenance; improve calculations and interpretations rather than restricting the studies site to an archive. |
| [`mikepsinn/fda-gov-v2`](https://github.com/mikepsinn/fda-gov-v2) (private, archived 2026-09-26) | Optional reference, not a required dependency or active product | Trial-search/evidence UI and generation approaches are optional references; capture mostly overlaps; branding reference is in its old `apps/web`. No required port identified. Do not import old migrations/dependencies wholesale or present model scores as observed evidence. See the [retirement record](fda-gov-v2-retirement.md). |

ClinicalTrials.gov/AACT is an additional **data source**, not another app or
repository to merge. Build ingestion of posted results, starting with adverse
events and comparisons between treatment and comparison groups.

### External and first-party evidence sources

All rows below describe planned ingestion/publication, not verified live pipelines.

| Source | Destination | Required distinction |
| --- | --- | --- |
| Reddit / permitted public discussions | App evidence adapters and review queue; source-linked community reports on existing condition/treatment pages | Access/processing approval first; anecdotes are not enrolled patients or clinical effect estimates |
| AI/model estimates | App evidence modules and planned `ModelEstimate` contract; existing public/demo pages | Preserve/improve with current-best-estimate labels; not additional empirical evidence |
| Illustrative demo data | Planned `DemoExample` contract and separate example fixtures/records | Example labels persist; not model best estimates or actual patients/study participants |
| ClinicalTrials.gov API v2 / AACT | `packages/trials` -> normalized study/effect records -> trial search and evidence pages | Registry discovery versus posted results; deduplicate the same NCT study across transports |
| Papers and existing reviews/meta-analyses | Evidence review/extraction -> cited research and versioned synthesis releases | Trace underlying studies; never pool a review alongside its constituent trials |
| Patient treatment ratings and study follow-ups | Existing patient/rating/measurement storage extended with report context, permissions and protocol versions | Private by default; authorized reports/aggregates stay separate from trials and comments |
| curedao-api time-series studies | Legacy import -> `TimeSeriesAnalysis` -> app study reports/charts and evidence views; `packages/analysis` reproduces calculations | Source-backed observational results; personal versus population scope, historical versus reproduced/corrected status and publication permissions stay explicit |
| Independent clinic contributions | `packages/clinic-aggregates` -> validated clinic-data-exchange submissions | Approved aggregates only, with tested privacy/overlap controls |

The [source/storage map and contracts](EVIDENCE-AND-EXCHANGE.md) also cover
personal-data exports, corrections/withdrawals, provenance and published analysis versions.
The [data-population plan](EVIDENCE-AND-EXCHANGE.md#populate-data-through-files-mcp-and-the-admin-ui)
starts with versioned demo packs and one importer, then adds scoped MCP and admin
clients. None of those new import/curation interfaces is established by existing
tracking screens or by the planned tracking MCP migration.

### Extraction checklist

Unchecked items below are planned or awaiting acceptance, not confirmed complete.

From Optimitron:

- [ ] Port the dFDA MCP measurement, reminder, and notification tools into `/api/mcp` over this app's data layer.
- [ ] Port the tracking REST API for measurements, reminders, notifications, and variables, with its OpenAPI document.
- [ ] Extract the tested ClinicalTrials.gov search client into `packages/trials` and connect the existing trial-search page.
- [ ] Evaluate/extract TypeScript N-of-1 analysis into `packages/analysis` against the curedao-api reference baseline. Recheck and resolve reported small-sample p-value and effect-direction problems; this library alone does not prove feature or numerical parity.
- [ ] Extract wearable/app export parsers into `packages/importers`.
- [ ] Use condition names and ICD-10 codes in `packages/health-vocabulary`.
- [ ] Adapt useful condition/treatment content and AI estimates, retaining available generation/source metadata and explicit current-best-estimate labels; improve them incrementally.
- [ ] Adapt selected landing/about/FAQ content and bring relevant tests with the moved features.

From Crowdsourcing Cures and the legacy API:

- [ ] Add the patient-rating dataset and corresponding ranking views alongside labeled demo/model estimates; progressively improve coverage without conflating ratings, examples and effect estimates.
- [ ] Adapt selected AI-written analyses/articles as labeled demo drafts, verify supporting citations, and improve their estimates; do not describe unreviewed generated text as a completed meta-analysis.
- [ ] Port text-to-measurement logging alongside the existing image capture actions.
- [ ] Map legacy variables, app seeds, and condition codes into the shared health vocabulary.
- [ ] Implement consent and migration for personal measurements held by curedao-api or Optimitron.
- [ ] Complete the curedao-api workflow/route/consumer inventory and capture a versioned reference baseline; record explicit reproduce/improve/defer/retire decisions rather than silently dropping features.
- [ ] Import eligible personal/population study results with source links, counts, methods and unknowns; distinguish historical imports from reproduced or corrected analyses using `TimeSeriesAnalysis`.
- [ ] Port/reimplement the reference pairing, lag/duration, correlation, baseline/follow-up and population aggregation behavior in `packages/analysis`; add private authorized replay fixtures and public synthetic known-answer tests, with reviewed numerical differences.
- [ ] Reproduce variable charts, predictor/outcome search and generated study reports, including permitted sharing/export and stable legacy-link mappings. Reconcile conflicting statistics and derive cards, narrative and charts from one result version.
- [ ] Verify measurement history/edit/delete/export, reminders/inbox/log/skip/snooze, and selected connectors/reconnection/sync end to end; disclose remaining gaps and keep working legacy routes until replacements or exceptions are accepted.

From `fda-gov-v2` (review complete; checked means a decision, not a completed port):

- [x] Landing comparison/source list/sticky navigation: defer presentation reuse; reject wholesale campaign-copy replacement.
- [x] Search and intervention cards: optional UI/generation reference, not a required extraction; any reused model scores follow the demo estimate policy rather than being presented as measured evidence.
- [x] Trial-search controls/results: defer a targeted port with the roadmap's API v2 client; do not copy the old `/api/int` adapters unchanged.
- [x] Capture and nutrition review: current code overlaps; reject a second flow and retain old refinements as reference.
- [x] Logo/favicon settings: defer to clinic configuration; source is old `apps/web/config/site.ts` and `env.mjs`, not old `apps/dfda-node`.

The [retirement record](fda-gov-v2-retirement.md) pins the audited `develop`
commit `cf29035c`, records shared ancestry and deployment checks, and preserves
all branches in a verified backup. The repository is archived, not deleted;
deferred code remains available without maintaining another product.

## Planned packages and product features

These package directories do not yet exist in the inventoried master tree.
Implement the contracts needed by the first working slice, not empty scaffolding
for every planned package. See the [next implementation slice](MIGRATION.md#next-implementation-slice).

| Planned package | Features | Starting point |
| --- | --- | --- |
| `packages/analysis` | Personal/population time-series analysis, descriptive scores, study-effect estimation and compatible meta-analysis | curedao-api reference calculators/tests plus selected Optimitron TypeScript code; reproduce behavior, resolve correctness issues with documented differences, and build/test missing methods |
| `packages/trials` | Trial search, posted-results ingestion, group comparisons, adverse-event rates, NCT-linked evidence and study-protocol contract | Extract search client; build results parser, protocol contract and optional bulk AACT adapter |
| `packages/health-vocabulary` | Stable names/IDs for conditions, treatments, outcomes, and units; outcome direction and mapping | Reconcile legacy variables, app seeds, and Optimitron condition codes |
| `packages/evidence` | Shared source, community/patient report, time-series-analysis, study-effect, model-estimate, demo-example, published-analysis-version and withdrawal contracts; provenance/deduplication primitives | New; app owns fetching, estimate generation, review workflow and persistence |
| `packages/importers` | Wearable/app parsing and personal-data export contract | Extract Optimitron parsers already ported from legacy PHP connectors; add portable export format |
| `packages/clinic-aggregates` | Aggregate-only `ClinicSummary` format and validators | New work shared by independent installations and clinic data exchanges; not a personal-record or comment format |

| Product component | Features still to build | Intended location |
| --- | --- | --- |
| Demo data and agent curation | Medical dataset forked from Optimitron (edited here) and bounded trial-result snapshot present; common database importer, scoped MCP tools and admin batch review planned | Present `apps/web/data/optimitron/` and `apps/web/data/evidence/`; planned `apps/web/lib/evidence/import`, restricted jobs and thin CLI/MCP/admin adapters; shared record schemas remain in `packages/evidence` and their other designated owners |
| Legacy app and study parity | Tracking-to-study journey, predictor search, charts, imported/reproduced/corrected personal/population reports, and migration reconciliation | Existing patient/public routes and restricted app analysis jobs; shared `analysis` and `evidence` packages; [acceptance baseline](MIGRATION.md#what-comes-from-curedao-api) |
| Community evidence | Permitted source adapters, source-linked extraction/review, separate scores, corrections and deletion propagation | `apps/web/lib/evidence`, existing worker and planned evidence/analysis packages |
| Create/join studies | Personal tracking, observational protocols and interventional proposals; versioned review/consent/enrollment flow | `apps/web/lib/studies` extending current trial/enrollment actions and UI |
| Independent installation | Configurable branding, independent operations, tested backup/restore/upgrades and data portability; opt-in sharing later | Same `apps/web` release, `lib/instance` and deployment packaging; no fork per clinic |
| Evidence pipeline | Source ingestion, normalization, review, compatible analysis and publication | App evidence modules and restricted workers; useful without clinic data exchange |
| Clinic data exchange | Installation identity, authenticated aggregate submissions, monitoring, correction/withdrawal handling and validation before pipeline processing | Optional app-owned administration and restricted jobs; not a required separate product app |
| Clinical-record analysis | Design-specific treatment-effect estimation, beyond legacy descriptive correlations, baseline/follow-up comparisons and population aggregation | New/reviewed analysis methods; reproducing an observational calculation does not establish causality |
| Demo and evidence publication | Persistent example/estimate/source-backed labels, progressive estimate improvement, provenance, outcome direction, supported uncertainty, ranking eligibility, and separation of empirical evidence types | Public pages backed by the shared packages; detailed rules remain in [MIGRATION.md](MIGRATION.md#rules-for-published-numbers) |

Third-party OAuth connections and data imports remain capabilities of
`apps/web`; `packages/importers` covers export parsing, not a complete connection
service. Connection authorization and token handling need their own design.
Public and marketing pages remain in `apps/web`. Network administration belongs
to the clinic data exchange; these capabilities do not require additional product
apps. The current service-role reminder worker is not a safe default credential
boundary for source ingestion or public publication.

## Features excluded or retired

- `apps/crowdsourcing-cures` and experimental `apps/fdai` were removed from this repository. The standalone Crowdsourcing Cures repository remains separate.
- `apps/dfda-node` was renamed to `apps/web`. Local caches or data left under the old path are not another tracked app.
- The old `mathematical-modeling`, `autonomous-researcher`, `link-checker`, `deployer`, and `gcp-setup` packages were removed. They are not prerequisites for the new package list.
- Optimitron's old trial-results parser remains excluded because it mismatches table values; the migration plan calls for a new parser. Its AI-estimated numbers and useful condition/treatment content are now explicit labeled-demo migration candidates, not excluded by origin.
- Optimitron keeps shared `tracking`, `db`, and `data` packages used by its other sites, its own MCP server, and economic-model constants. Extract the selected functionality rather than moving those entire packages.
- Crowdsourcing Cures keeps its organization pages. Legacy-data proxy code is not copied wholesale, but its tracking, charts, predictor search and population-study behavior is part of the replacement baseline; redirect/remove routes only after equivalent behavior or explicit exceptions are accepted. Selected AI-written analyses are eligible demo content to improve; drug registration and the muscle-mass cost-benefit page remain outside the extraction scope.
- Referendum voting is optional public advocacy functionality, not a required clinic module. The landing page's "Sign to Support" button and its thank-you page were removed, because the button only wrote a log line and stored no signature.

## Sequence and migration dependencies

Follow the single [delivery sequence and exit gates](MIGRATION.md#order): the
legacy tracking/analysis/reporting loop and progressive evidence improvements come
before independent clinic installation and optional federation. Community access approval is not a dependency for
first-party reporting or ClinicalTrials.gov discovery. Living meta-analysis does
not have to wait for clinic recruitment.

Before the domain moves, disentangle OAuth accounts/tokens, users' tracking
data, and Optimitron's shared `no-reply@updates.dfda.earth` sender. Existing MCP
connectors will need to reconnect to the new authorization server. The
[migration plan](MIGRATION.md#what-comes-from-optimitron) describes a temporary
API-forwarding option if the public pages move first.

The unresolved user-data decision is how to request migration consent and what
to do when users do not respond. No data transfer is implied by this inventory.
