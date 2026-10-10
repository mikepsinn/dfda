# Migration plan

**Status:** implementation roadmap, updated 2026-09-27. The base app exists;
the extraction, evidence pipeline, independent installation, and federation
below remain planned unless the inventory marks specific code present.

dFDA code and data are spread across four repositories. The plan: [`apps/web`](../apps/web) in this repo (formerly `apps/dfda-node`) is the base. It takes over dfda.earth, and the dfda features in optimitron's `apps/dfda` move into it. This document lists where things are, what moves, what happens to each dataset, and the order of the work. Each step can ship on its own.

**Product goal:** reproduce the useful workflows and analyses of the app powered
by `curedao-api` in `apps/web`, then improve them. This includes the time-series
studies at studies.crowdsourcingcures.org, not just tracking screens or new evidence
pages. The [legacy feature baseline](#what-comes-from-curedao-api) defines what must
be accounted for before claiming the new app replaces the old one.

Documentation ownership:

- [Product architecture](PRODUCT-ARCHITECTURE.md): one product, deployment/data boundaries, white labeling, and code ownership.
- [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md): external sources, scoring, study workflows, contracts, privacy, and acceptance tests.
- [Apps and features](APPS-AND-FEATURES.md): present code versus extraction candidates and new work.
- This document: migration decisions, publication policy, and the single delivery sequence. New specifications do not mean features have shipped.

## Demo-first product goal

The immediate goal is a useful demo that makes the intended product understandable,
not a clinically validated evidence service at launch. Keep the existing AI-generated
content and estimates, label their status, and progressively improve them with better
sources and methods. Removing estimated numbers or blanking useful screens is not a
milestone or a prerequisite for demonstrating the product.

Use the concise label **"Current best estimates"**. Do not repeat
"AI-generated" throughout the public interface or expose import/debug provenance
as a large page section. Retain origin, basis, limitations and dates in the data
and developer documentation; show actual study citations when verified.
"Best" means the demo's
current provisional estimate, not an established medical consensus. Purely illustrative
seed values remain **"Example data"**, not best estimates or observed patient results.
Where the generation history or uncertainty is unknown, say so instead of inventing it.

Improve one treatment/condition view at a time: verify supporting references, add
patient-reported and trial-reported results, and revise or supersede estimates when
better information is available. Keep the distinctions visible on screen and in
exports; an estimate is not an additional study or participant. The detailed
[estimate policy](EVIDENCE-AND-EXCHANGE.md#demo-estimates-and-progressive-improvement)
defines that boundary. Real patient access, consent and study recruitment retain
their own safeguards; demonstrating a workflow does not establish that it is ready
for live clinical use.

Populate the demo with versioned JSON/JSONL data packs and one validated importer,
then expose that importer through scoped evidence MCP tools and an admin review
screen. Keep these separate from private tracking permissions; agents submit
structured records, not arbitrary SQL. The [data-population specification](EVIDENCE-AND-EXCHANGE.md#populate-data-through-files-mcp-and-the-admin-ui)
defines locations, previews, repeatable imports and publication controls. This is
planned work beyond the first local Optimitron demo pack and deterministic
exact-copy script described in [current priorities](#current-priorities-and-to-do-list).
The general-purpose importer and MCP tools remain unimplemented.

## Where things are today

| Repository | What it has | Runs at |
| --- | --- | --- |
| `mikepsinn/dfda` (this repo) | [`apps/web`](../apps/web): Next.js and Supabase app for patients, providers and research partners. [`packages/legacy-import`](../packages/legacy-import): tools for moving data out of the legacy MySQL database. | prototype.dfda.earth |
| `mikepsinn/crowdsourcing-cures` (private) | Organization homepage, patient-rating Treatment Rankings, trial search, articles | crowdsourcingcures.org |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | `apps/dfda`: condition and treatment pages (the numbers are AI estimates), trial search, and an MCP server and REST API for personal tracking. It shares optimitron.com's database and sign-in. `packages/optimizer`: N-of-1 analysis. `packages/tracking`: measurements and reminders. `packages/data`: wearable importers, a ClinicalTrials.gov client, a condition list. | dfda.earth |
| `mikepsinn/curedao-api` (private) | Functional reference: PHP/AngularJS tracking app, accounts/OAuth, connectors, reminders, MySQL records, personal and population time-series analyses, charts and generated study reports | app.dfda.earth, studies.crowdsourcingcures.org |

## The base: apps/web

It already has:

- Sign-in through Better Auth (magic link, Google, password), and an OAuth 2.1 / OpenID Connect provider (PKCE, developer client management, dynamic client registration and discovery metadata for MCP clients)
- Patient screens: conditions, treatments, 0–10 treatment ratings, side effects, measurements and reminders
- Provider and research-partner screens
- Public condition, treatment, outcome-label and trial pages, and an OpenAPI route
- The white and purple theme that dfda.earth will use

One codebase covers the parts of the design:

| Part | In `apps/web` |
| --- | --- |
| Personal health workspace | Patient interface in the hosted app. Local-first storage and operator-blind encryption are not established by these screens. |
| Clinic workspace | Provider interface in the same maintained product. A separately operated copy is an independent installation, with its own auth, records, storage, configuration and credentials. |
| Evidence pipeline | Ingestion, provenance, compatible analysis and publication in app-owned modules/restricted jobs. Works without clinic sharing; not another required website. |
| Clinic data exchange | Optional registration of contributing installations, authenticated aggregate submissions and correction/withdrawal handling. Accepted data enters the evidence pipeline. |

Offer a managed service and optional independently installed, branded copies of
one release. Do not create a fork per clinic or a server per patient. Branding
does not create authorization boundaries or permit changing evidence rules.
Independent clinic data exchanges may implement the same contracts; federation is opt-in.
See [product architecture](PRODUCT-ARCHITECTURE.md) for installation gates and
the distinction between a hosted personal health workspace and a future locally
encrypted client.

### Scope boundaries

Public and marketing pages, patient and provider workflows, and developer
access belong to `apps/web`. Shared computation and formats belong to the
packages below. This is the implementation roadmap; the [feature inventory](APPS-AND-FEATURES.md)
records current code and extraction candidates.

Third-party OAuth connections and data imports remain capabilities of the
receiving app. The planned `importers` package provides export parsers, not a
complete connection service. Authorization, token handling, and any ongoing
sync require design and implementation; no separate central token-store
service is assumed.

Installation registration and identity, authenticated submissions, contribution
policies, and network monitoring belong to the clinic data exchange's administration.
Consent records and aggregate privacy controls remain prerequisites for
sharing clinic data. Public-source ingestion/publishing jobs must not inherit
the existing reminder worker's unrestricted patient-data credentials.

Before it serves dfda.earth, make its demo status and per-number origin clear. Its
outcome labels currently show demo seed data (including a placeholder citation) and
AI-generated numbers. Retain the useful demo, distinguish example data from current
best estimates and source-backed results, and label placeholder references as examples
until verified replacements are available. Complete clinical evidence coverage is not
a cutover requirement.

## What comes from optimitron

Everything dfda-specific leaves optimitron, including dfda.earth's MCP server and tracking REST API. optimitron.com keeps its own MCP server. Moved features are restyled from optimitron's neobrutalist style to the web app's theme.

| Feature in optimitron `apps/dfda` | In `apps/web` | Notes |
| --- | --- | --- |
| MCP server: 11 tools for measurements, reminders and notifications | A new `/api/mcp` route over the web app's existing measurement and reminder code | Signs in through the web app's own OAuth server, which needs three changes first: dynamic client registration, the standard `.well-known` metadata, and a token endpoint that accepts form-encoded requests (it reads only JSON today, and OAuth clients send forms). The existing actions get their database client from the Supabase session cookie, so the route builds one from the bearer token instead of calling them as they are. This is the tracking tool group; new evidence-curation tools use separate scopes over the shared importer. |
| REST API (`/api/v1`: measurements, reminders, notifications, variables) and its generated OpenAPI document | Next to the existing OpenAPI route | Same auth as the MCP server |
| Trial search | The existing `find-trials` page, using `packages/trials` | optimitron's ClinicalTrials.gov client replaces the web app's unused helper |
| Landing, about and FAQ content | Existing public pages | Copy only |
| Condition and treatment pages and AI estimates | Adapt useful content and estimates into the existing condition/treatment pages | Preserve demo coverage with explicit current-best-estimate labels and available generation/source metadata. Add patient ratings and trial results as distinct views, then improve or supersede estimates; do not exclude content simply because AI generated it. |
| 6 unit tests | With the features they cover | |

### What to extract next from Optimitron

The complete medical dataset is now copied locally (221 original files, all
metadata preserved). Do not create another reduced dataset. The following source
code was spot-checked on 2026-09-27; these are extraction candidates, not completed
migrations or a new audit of every dependency:

1. **Treatment and outcome presentation:** reuse useful structure/logic from
   `components/shared/InterventionCard.tsx`, `components/condition/TreatmentRankings.tsx`,
   `components/treatment/HealthEconomicsDisplay.tsx`, `TreatmentMetricsGrid.tsx`
   and `components/landing/OutcomeLabel.tsx`. Use this repo's existing landing-page
   theme and shared UI primitives. Add condition search/filtering, cross-condition
   treatment browsing, and displays for the now-preserved metadata. Correct score
   percentages versus 0–100 scores and do not imply copied trial counts are verified.
   The source Outcome Label calls a grounded-generation action when data is absent;
   adapt its display without adding paid calls during page rendering.
   **Local progress:** condition/synonym search, comparison cards, the existing
   landing-page Outcome Label renderer, annual cost/breakdown, expandable
   cost-effectiveness details and snapshot regimen displays are integrated.
   Actions use the existing shadcn buttons; posted trial results stay separate.
   See [UI conventions](DESIGN-SYSTEM.md). Cross-condition treatment browsing,
   reference pages and the remaining metadata still need integration.
2. **Trial discovery:** extract `packages/data/src/fetchers/clinical-trials-gov.ts`
   with its focused tests and relevant app search/filter components. This is registry
   discovery, separate from the new posted-results extractor and meta-analysis work.
   **Started:** the client and its tests are copied unchanged into
   `apps/web/lib/trials/clinical-trials-gov.ts` (source commit `700dcbc`).
   `/conditions/{id}/trials` lists recruiting registry studies for the condition, 10 per
   page, with links to each record and to the full registry search. Its paging follows
   crowdsourcing-cures' trial search: the registry's forward cursor, a way back to the
   first page, and recovery from an expired cursor. `/find-trials` is the full registry
   search: condition, treatment and location (typed, or the browser's location rounded to
   about 1 km, with a distance), and under "More filters" the study status and the type,
   sex and age of who can join. Results show the search as chips, as crowdsourcing-cures
   did, and the search and page links scroll to the results. The condition trials page and the treatment pages
   link to it. The sex filter keeps studies open to the participant's sex, including
   studies open to all; the client's own sex filter keeps only single-sex studies. Name
   suggestions come from ClinicalTrials.gov's undocumented `/api/int/suggest` endpoint,
   called from the browser as an optional aid: when it fails, the form works without them.
3. **Tracking, reminders and MCP/REST:** adapt `apps/dfda/lib/mcp/`, `app/api/v1/`,
   the generated OpenAPI contract and their tests. The source's tracking provider
   injects Optimitron's Prisma database and its MCP auth uses the shared issuer.
   Rewire to dFDA-owned auth/storage and user scopes; copying these files does not
   migrate accounts or authorize importing private health records.
4. **Health imports and analysis:** reuse selected `packages/data/src/importers/`
   parsers, unit conversion/validation and their tests, followed by selected
   `packages/optimizer` calculations under the curedao-api parity baseline below.
   Keep shared packages in Optimitron for its other apps; extract only the dependencies
   needed by each working dFDA flow.

The existing plan's account/data/email boundaries still apply. Do not copy
Optimitron's database, credentials, deployment configuration, political/economic
datasets or the old trial-percentage aggregation algorithm wholesale.

**What stays in optimitron**

- `packages/tracking`, `packages/db` and `packages/data`, which optimitron.com and the other sites use. dfda doesn't depend on them; they aren't published.
- The original shared medical dataset in `packages/data`, which optimitron's database seed also uses. dFDA forked the dataset on 2026-10-02 (from commit `06ffef0`) and now corrects it here, logging each change with a source in `apps/web/data/optimitron/corrections.json`; optimitron keeps its original copy, and the two are expected to diverge. dFDA does not depend on Optimitron's runtime database.
- The `DFDA_*` constants in the `packages/data` parameters. They are economic-model inputs used by several optimitron sites, not app code.
- The site-kit "how it works" sections that other optimitron sites render. Their links keep pointing at dfda.earth.

**What has to be untangled**

1. **Accounts.** dfda.earth's current accounts are optimitron accounts, and its MCP server only accepts tokens that optimitron.com issues. After the move, people sign in with web app accounts, and MCP connectors reconnect once.
2. **Data.** dfda.earth reads and writes the same database as optimitron.com: users, measurements, reminders, notifications and variables. People who tracked through dfda.earth need a way to bring their data along (see Open decisions).
3. **Email.** Every optimitron site sends email from `no-reply@updates.dfda.earth`. optimitron needs its own sending address before dfda.earth leaves.
4. **Cleanup in optimitron** after the move: `apps/dfda` itself, the dfda site variants in site-kit and `apps/optimitron`, dfda.earth in optimitron.com's list of MCP hosts, the CI build entry, the `pnpm copy` and visual-test scripts, the Vercel project scripts, and the docs that mention `apps/dfda`. optimitron.com's redirects of `/conditions`, `/treatments` and `/find-trials` to dfda.earth can stay.

**Cutover.** Switch dfda.earth after the relevant [cutover gates](#order) pass, including working MCP/REST access or tested temporary forwarding. If the pages are ready first, the web app can forward `/api/mcp`, `/api/v1/*`, `/.well-known/oauth-protected-resource/mcp` and `/openapi.json` to the old optimitron deployment on a Vercel address until then. This domain change does not retire unreplaced curedao-api workflows or the studies site.

## What comes from curedao-api

Reproduce capabilities, not the PHP/AngularJS architecture. Existing app screens,
Optimitron's TypeScript analysis code, and legacy import tools are starting points;
none establishes full behavioral or numerical parity. New Reddit/trial evidence
and create/join workflows extend this foundation rather than displacing it.

This initial baseline comes from targeted inspection of local `curedao-api` commit
`47ea2bcc91e71e49fb70eb3c2a88867487377399` on 2026-09-26. Reference paths below
are relative to that private repository. This is not a complete route inventory,
a live connector audit, or a run of the legacy tests. Before implementation, pin
the deployed reference/version where available, inventory remaining workflows and
client/API consumers, and record each as reproduce, improve, explicitly defer, or
retire with the product owner's agreement. Unlisted features are not silently retired.

| Capability to reproduce | Reference starting point | Destination and acceptance requirement |
| --- | --- | --- |
| Accounts, authorized access and data portability | Existing legacy accounts/OAuth; `routes/api.php` | Existing `apps/web` auth plus user-directed migration/export. Reconcile identities and permissions; do not copy active sessions, credentials or implied sharing grants. |
| Measurement entry, import, history, editing/deletion and export | Measurement routes in `routes/api.php`; `tests/APIs/MeasurementExportApiTest.php` | Patient screens/actions and `packages/importers`; preserve variable IDs/mappings, units, timestamps/time zones, aggregation and missingness. Check record reconciliation and round-trip exports. |
| Reminders, inbox and logging from notifications | Tracking-reminder/notification routes; `tests/APIs/TrackingReminderApiTest.php` and `TrackingReminderNotificationApiTest.php` | Existing reminder UI/worker extended and tested for scheduling, log/skip/snooze, time zones, retries and duplicate prevention. |
| Connector catalog, connection/reconnection, imports and sync status | `app/DataSources/QMConnector.php`; connector routes and tests | App-owned authorization, secure token storage and sync jobs; parsers alone do not reproduce working connections. Inventory providers and test selected providers individually; disclose unavailable/deferred ones. |
| Variable browsing, predictor/outcome search and charts | `app/Buttons/States/`, including predictor/history states; `app/Charts/CorrelationCharts/` | Patient/public routes as permitted, shared analysis outputs and chart data. Preserve positive/negative associations, personal versus population scope, filters and source links without presenting rankings as causal recommendations. |
| Personal time-series studies | `app/Correlations/QMUserCorrelation.php`, `app/Studies/QMUserStudy.php`, correlation property calculators | `packages/analysis` plus app-owned jobs/private results: pairing, onset delay, duration of action, correlations and baseline/follow-up comparisons with explicit method settings. |
| Population analyses | `app/Correlations/QMAggregateCorrelation.php`, `app/Studies/QMPopulationStudy.php`, aggregate property calculators | Reviewed aggregation of eligible personal analyses, with weights, cohort lineage and distinct-person/paired-observation counts kept separate. No automatic independence or causal claim. |
| Generated study pages, search, sharing and exports | `app/Studies/StudyText.php`, `StudyHtml.php`, `app/Services/StaticExportService.php` | `apps/web` study reports and evidence views backed by versioned results. Reproduce useful statistics, scatter/time-series/lag charts, readable explanations and permitted sharing/export; preserve old study/variable links through verified mappings/redirects. |

### Import results, then reproduce and improve them

Legacy studies computed from recorded measurements are **source-backed
observational analyses**, not fictional examples or unsupported model guesses.
Bring eligible existing results into the demo/evidence views with source links,
personal/population scope, available method/count/date metadata and explicit
unknowns. A useful label is **"Legacy automated observational analysis -
reproduction pending."** Review permissions and the display before publication,
but do not require every historical analysis to be recalculated before showing
clearly labeled imported findings. Publicly available does not mean raw personal
records may be copied or republished.

Keep three states distinct: imported historical result, reproduced result under
the reference method, and corrected/new-method result. Importing a report proves
neither numerical reproduction nor clinical validity. Preserve permitted original
values/provenance and connect corrections through versioned supersession; unknown
or unavailable source data/methods remain explicit. See the
[time-series evidence rules](EVIDENCE-AND-EXCHANGE.md#time-series-studies-from-recorded-data).

### Functional and numerical acceptance

1. **Capture the reference.** For representative workflows, record inputs,
   parameters, code/data versions, expected outputs and screenshots/report sections.
   Use authorized private fixtures in restricted storage and synthetic known-answer
   fixtures in Git; never commit health records or credentials. Reuse relevant legacy
   tests, including `tests/UnitTests/Analytics/CorrelationCalculationTest.php`, after
   reviewing their assertions rather than assuming a passing legacy test proves correctness.
2. **Compare the same calculation.** Check variable/unit mapping, time zones,
   resampling, exposure/outcome pairing, lag and duration windows, missingness,
   baseline/follow-up definitions, person/measurement/pair counts, aggregate weights,
   estimates and uncertainty. Define per-metric tolerances and expected differences;
   test sparse, constant, missing, zero-baseline and overlapping data, not just a
   correlation coefficient on a happy path.
3. **Correct known defects explicitly.** Numerical parity is a diagnostic, not a
   requirement to retain a bug. Document reviewed old/new differences and method
   versions; do not silently choose one conflicting statistic as correct. One
   canonical result supplies cards, charts, narrative and exports. The existing
   [steps/sleep population report](https://studies.crowdsourcingcures.org/study/cause-1451-effect-1867-population-study)
   contains conflicting p-value/significance presentations and is a reconciliation
   case, not a validated expected answer. Its underlying data has not been recomputed
   as part of this planning work.
4. **Prove the complete user journey.** Import or log data -> inspect/edit history
   and charts -> find predictors/outcomes -> open a personal study -> view an eligible
   population analysis -> read/share/export an authorized report -> continue tracking
   with reminders. Verify access controls, recalculation after edits/deletion,
   failed/partial imports and reconnection, not only static screenshots.
5. **Protect continuity.** Keep working legacy routes/services until equivalent
   behavior or an explicit defer/retire decision is accepted. Test old deep links,
   client compatibility or migration notices, exports, redirects and rollback before
   removing them. A domain/demo cutover may be incremental; it is not proof of legacy
   feature parity. Independent hosting and clinic federation are not parity prerequisites.

## What comes from crowdsourcing-cures

crowdsourcingcures.org keeps the organization pages (home, initiatives, docs). Treatment rankings and text logging move into the base app; redundant health-data pages redirect only after equivalent workflows are accepted. Useful AI-written demonstration content can be adapted incrementally rather than excluded by origin.

| Feature in crowdsourcing-cures | In the base app | Notes |
| --- | --- | --- |
| Patient-rating Treatment Rankings: the treatments ranked for each condition, and each treatment's ratings across conditions | The existing condition and treatment pages, which have a ranking component but show demo data | The ratings data moves too (see Data). Rankings follow the rules for published numbers below. |
| Logging measurements by typing: a person writes something like "took 200 mg magnesium, slept badly" and an AI turns it into measurements | Next to the existing photo-to-measurements action | The AI only reads the person's own words and produces no evidence numbers. It saves to the old app today, so it is rewired to the base app's own tables. |
| Trial search | `/find-trials` | Its search behavior is ported: condition, treatment and status, name suggestions, and cursor paging. Its own ClinicalTrials.gov client is not moved; the web app uses optimitron's. |
| AI-written condition analyses, cost-benefit explanations and research articles | Select useful content for the existing public/demo pages | Retain and improve as labeled AI-generated drafts or modeled estimates, check citations, and distinguish illustrative synthesis from a completed systematic review/meta-analysis. Not a requirement to port every article before cutover. |

**Not moved**

- Legacy-data proxy implementations are not copied wholesale. Their measurement history, variable charts, predictor search, population studies, reminder inbox, connector and personal-workspace behavior belongs to the curedao-api parity baseline above. Keep working links/routes until replacements are accepted; inventory ancillary tools such as the reaction-time test for an explicit reproduce/defer/retire decision.
- The drug-registration form and the muscle-mass cost-benefit page.

## ClinicalTrials.gov results

Posted results can supply outcome and adverse-event data without waiting for
clinic recruitment. Registry entries without results still support discovery,
not effectiveness claims. ClinicalTrials.gov is not a provider of ready-made
treatment meta-analyses: dFDA must build and review those from eligible studies.
Do not hard-code a count of available studies; record the source snapshot/date.

How to use it:

- Start with the API v2 for selected studies and search; add [AACT](https://aact.ctti-clinicaltrials.org/) snapshots/SQL for reproducible bulk ingestion. Both feed the same contracts and underlying NCT study identities.
- Start with a posted between-group comparison (the first local slice below), then extend to reviewed adverse-event tables, preserving participants affected, at-risk denominators, reporting thresholds and observation windows. Events are not people; unreported events are not zero; not every comparator is placebo.
- Compare study groups, not rows. An effect is the treatment group against the comparison group on the same outcome measure and time frame. Use the trial's own posted comparison where there is one. Single-group studies give no comparison and are shown as such.
- Map each outcome measure to an outcome in the shared health vocabulary, with its unit and which direction is better, before pooling across trials. This is the hard part: every trial names and measures its outcomes its own way.
- Pool only compatible estimates using reviewed methods, with explicit handling of study design, uncertainty, shared controls and overlapping cohorts. Shared analysis code can later serve clinic summaries, without mixing the evidence types or assuming identical statistical models.
- Label source results as trial-reported; label calculated outputs as dFDA analyses of those results. Link NCT IDs, source versions, included/excluded studies, and method versions.

The old parser in optimitron (`apps/dfda/lib/fetch-trial-results.ts`) is not reused.
Code recheck on 2026-09-27 found that `hybrid-treatment-data.ts` calls it for up
to three completed trials, then falls back to generated outcomes when usable
values are absent. The parser guesses baseline/end values from category labels
or position and takes the first measurement group. Its aggregation averages
percentage changes by outcome name, without treatment-versus-control effect
extraction or uncertainty weighting. This is an earlier extraction/aggregation
attempt, not a validated meta-analysis; it was not rerun or ported in the current
demo import. The earlier inventory's 84 of 5,776 trial-tagged outcome values is a
historical source-label count, not proof of correct extraction or successful pooling.

**Implemented locally, 2026-09-27:** a new bounded adapter reads a selected API v2
outcome from NCT01097616, matching groups by ID and using the posted adjusted
suvorexant LD-minus-placebo contrast at Month 3: 10.7 minutes of diary-reported
sleep time (95% CI 1.9–19.5), with 228/339 participants analyzed. The public
Outcome Label shows it separately from estimates and links to the posted results.
The exact secondary endpoint, source fields, selection rationale, snapshot,
refresh/check commands and limitations are in the
[trial extraction notes](../apps/web/data/evidence/README.md). This is one reported
result, not a new meta-analysis, exhaustive search or clinical validation. No
ranking score was recalculated from it. Next, screen another compatible study
and review endpoint compatibility, study bias, overlap/shared controls and
variance handling before implementing tested pooling.

## Community evidence and participation

Reddit and other permitted discussions become source-linked community reports,
not patient enrollments or trial results. Source access and permitted processing
must be confirmed before ingestion; unavailable Reddit access must not block
first-party reports, trial discovery, or study creation.

Extend the existing condition/treatment pages with separate research, community,
patient-report, and later clinic-evidence sections plus study discovery. Preserve
source links and review status; expose distinct benefit, harm, completeness,
evidence-strength, and research-priority views rather than one composite score.
The [source and contract specification](EVIDENCE-AND-EXCHANGE.md) defines their
denominators, provenance, retention, and code/storage destinations.

Build the create/join flow on existing trial, enrollment, measurement and reminder
code: personal tracking, reviewed observational protocols, and interventional
proposals requiring applicable review before recruitment. Study participation,
public reporting, clinician sharing, and aggregate contribution are separate
consent choices. An external registry trial links to its sponsor's application
path; dFDA cannot enroll someone merely by recording their interest.

## Shared packages

| Package | Contents | Built from |
| --- | --- | --- |
| `trials` | ClinicalTrials.gov/AACT search and results adapters; study-protocol contract | Search: optimitron's `packages/data` fetcher, which is documented and tested. The results parser and protocol contract are new. |
| `analysis` | Personal/population time-series calculations, descriptive report scores, study-effect estimation and compatible meta-analysis | curedao-api reference behavior/calculators/tests plus selected Optimitron `packages/optimizer` TypeScript code. Verify feature/numerical parity, document corrections, and recheck reported small-sample p-value and outcome-direction bugs before adoption; known-answer tests cover new and ported methods. |
| `health-vocabulary` | Shared names and IDs for conditions, treatments, outcomes and units | The curedao-api variables table, the `apps/web` seeds, and optimitron's condition list with ICD-10 codes |
| `evidence` | Shared source/report/time-series-analysis/effect/model-estimate/demo-example/published-analysis-version/withdrawal contracts, provenance and deduplication primitives | New; adapters, estimate generation and persistence remain app-owned |
| `clinic-aggregates` | Aggregate-only `ClinicSummary` format and validators, shared by independent installations and clinic data exchanges | New; not the format for comments or personal-data transfer |
| `importers` | Wearable/app export parsers and the personal-data export contract | optimitron `packages/data/src/importers`, which were ported from curedao-api's PHP connectors; export contract is new |

`packages/legacy-import` holds the tools for moving the legacy data. It is retired once the move is done.

These packages are planned, not scaffolding required before any feature can ship.
Their [ownership boundaries](PRODUCT-ARCHITECTURE.md#repository-ownership) and
[versioned exchange contracts](EVIDENCE-AND-EXCHANGE.md#exchange-formats-and-their-owners)
are authoritative; schemas, types, fixtures and consumers ship together.

## Data

| Data | Where it is | Plan |
| --- | --- | --- |
| Patient ratings: historically 162 conditions and ~3,900 treatments; recount at migration | curedao-api `ct_*` tables, copied into crowdsourcing-cures | Reconcile duplicates, scale and publication permissions; first eligible Data Release stays patient-reported and separate from clinic data. |
| ClinicalTrials.gov registry and posted results | Public (AACT or API v2) | Registry supports discovery; reviewed posted results support trial-reported evidence and derived analyses. |
| Reddit / other permitted public reports | External source, access and processing approval required | Source-linked community reports; retained only as permitted; never silently converted into patient records or enrollment. |
| Published papers, systematic reviews and meta-analyses | Cited publications and permitted full text | Reviewed extraction; connect to underlying study/cohort IDs and avoid double-counting reviews and their studies. |
| New patient ratings, observations and study outcomes | App's private patient/trial tables | Structured context, consent, provenance and protocol versions; publish only authorized reports or reviewed aggregates. |
| Legacy measurements: about 13 million, with per-user and population analyses | curedao-api MySQL | Move a person's data into their personal health workspace only if they choose to (see Open decisions). |
| Tracking data recorded through dfda.earth | optimitron's database | Same as legacy measurements |
| Automated personal and population time-series studies (historically ~15,800 published analyses; recount and reconcile at migration) | curedao-api analysis records and generated static site | Integrate eligible historical results as source-backed observational findings; preserve provenance and unknowns, then reproduce/improve calculations, charts and reports. Separate imported, reproduced and corrected versions; keep old links usable until continuity is tested. |
| AI-estimated medical data (historically 216 conditions, 969 treatments; recount at migration) | optimitron `packages/data` | Retain/adapt useful estimates with explicit AI/current-best-estimate status and available provenance; improve and supersede progressively. The condition list and ICD-10 codes seed the health vocabulary. |
| `apps/web` demo data | Existing Supabase seeds; complete source-pinned Optimitron medical directory under `apps/web/data/optimitron/` | Forked copy with a recorded origin, a sourced corrections log and tests that every edit is logged. General-purpose database contracts/importer remain planned; preserve labels, source permissions and separation from live records. Do not clear the demo or patient tables. |

## Order

### Current priorities and to-do list

Focus on improving the current product, not consolidating Git history. The local
history-import candidates are parked and unpublished; no history merge or
private-source publication is needed for any milestone below. Keep the existing
README and useful demo content. Work remains local for review until a push is
explicitly approved.

The following is the short execution checklist for the delivery sequence below,
not a second roadmap. Finish one demonstrable user journey before expanding the
platform. Unchecked items are not shipped or verified end to end.

**Now: one repeatable, useful demo (step 1)**

Local progress, 2026-09-27: the complete Optimitron medical dataset now supplies
1,214 treatment comparisons across all 216 conditions at `/treatment-rankings`,
linking to dedicated demo Outcome Labels. All 221 original files are copied intact,
including catalogs, references and previously omitted dose/cost/citation metadata.
The thin runtime adapter, full-inventory tests and a read-only comparison script are
implemented; see the [dataset notes](../apps/web/data/optimitron/README.md).
The old three-condition projection is removed, not maintained alongside the source.
This comes before the full importer and tracking backend. No database records
were imported, and no clinical source validation or publication approval is claimed.
Expand this working view before building general-purpose infrastructure.
The comparison UI now reuses the landing-page theme and Outcome Label renderer,
with searchable conditions, shared score cards, cost breakdowns and regimen details.
It adds no model calls or dependencies; the original dataset remains unchanged.
One source-backed posted comparison is also now visible on the suvorexant/insomnia
label, separate from the provisional scores. The ClinicalTrials.gov adapter has
an offline source fixture/checksum and preview/explicit-write commands; no pooling
or general-purpose source importer is implied.
Browser checks confirmed the rankings and an Outcome Label render on desktop/mobile,
condition/sort submission works and keyboard back-navigation works; no browser
errors or horizontal overflow were observed. A repeatable full browser regression
suite remains to be added.

- [ ] Restore and verify the local development baseline: frozen-lockfile dependency
  install, unit tests, type checking, lint and build. Record failures separately
  from unrun checks; use a dedicated local/test database, not production resets.
- [x] Select one existing condition/treatment page and trace its current data and
  navigation. Define the demo journey: open condition -> compare treatments ->
  inspect an Outcome Label and its origin/source -> find related trials or open a
  clearly marked preview of participation. Do not imply actual enrollment.
- [x] Copy the complete pinned medical dataset and connect all condition files to
  rankings/Outcome Labels. Preserve every upstream field and verify file checksums.
- [x] Improve the comparison journey using existing UI primitives: searchable
  conditions, clear navigation actions, shared Outcome Labels and cost/regimen
  displays. Keep estimates and source-backed trial results separate.
- [ ] Finish reviewing the copied Optimitron/dFDA content and estimates.
  Check redistribution rights and available provenance; keep AI estimates,
  illustrative examples and observed results distinct. Do not invent references,
  participants or uncertainty to make the demo look complete.
- [ ] Implement only the contracts needed by that pack and the shared importer's
  validate/preview/apply/status path. Test invalid records, replay, conflicting
  revisions, private-data rejection and preservation of existing user edits.
- [x] Add one source-linked posted trial comparison with an exact endpoint,
  reported between-group effect/interval and arm-specific denominators; test
  mismatched groups, missing values and unsupported layouts. Keep estimates separate.
- [ ] Review a second eligible comparison and synthesis question, record
  inclusion/exclusion decisions and cohort overlap, then implement tested pooling
  for compatible studies. Do not average treatment percentages by name.
- [ ] Connect that bounded view to the validated records. Keep origin labels and
  source links visible; cover loading, empty and error states, mobile layout and
  keyboard navigation. Preserve useful estimates while improving their basis.
- [ ] Add a deterministic end-to-end smoke test and verify the selected journey in
  a browser. Document reproducible setup in the app's developer instructions;
  require no paid AI call or private production credentials for the demo fixture.

**Next: make the tracking and study loop real (step 2)**

- [ ] Capture one authorized curedao-api reference study with inputs, method
  settings and expected outputs; use synthetic known-answer fixtures in Git.
- [ ] Verify measurement entry/import -> history/chart -> personal analysis ->
  report/export -> reminder logging. Reproduce the selected reference calculation
  and document intentional corrections; then extend to eligible population results.
- [ ] Connect patient ratings and trial discovery with separate evidence origins.
- [ ] Expose the importer through scoped MCP/admin tools after the importer and
  authorization checks work; no direct agent access to unrestricted patient tables.

**After that:** protocol creation and reviewed participation; permitted community
report ingestion and source-linked summaries; compatible living meta-analyses.
Domain cutover follows its existing migration gates. Independent installations,
white labeling and federation remain later work, not prerequisites for this demo.
Do not retire legacy services merely to simplify the portfolio.

**Baseline checked 2026-09-27 at local `master` `49e649e13`:** public condition,
treatment, Outcome Label and trial-search routes and patient screens are present.
The general-purpose `apps/web/lib/evidence/import` and shared
evidence/analysis/trials packages remain planned; the complete local `apps/web/data/optimitron`
snapshot is now present. Existing
unit and browser-test files do not establish that those new workflows work.
The initial missing Vitest dependency was resolved by a frozen-lockfile install
(lifecycle scripts disabled). All 63 unit tests, including full-dataset,
trial-extraction, condition-search and missing/zero-value presentation tests, and
TypeScript checking pass. The existing lint command fails loading
`@typescript-eslint/no-unused-expressions` on an unchanged auth file; this is an
open tooling issue, not a passing lint result. Production compilation and static-page generation completed,
but standalone packaging failed with Windows `EPERM` creating dependency symlinks;
the full build is not passing. Fix the local packaging environment and re-run
before claiming a release-ready build. The dataset was forked from its
upstream commit, whose 221 files are recorded in the manifest; edits since are logged in `corrections.json`. All 216 condition files
were validated; selected UI, trial-search and tracking/MCP dependencies were spot-checked.
Other external repositories and live deployments were not re-audited. Local generated directories under retired app/package names are
not additional maintained applications and must not be deleted as part of this work.

### Delivery milestones

This is the single delivery roadmap, not a list of completed milestones. Start
with a small working slice of step 1, then grow the curedao-api replacement and
evidence workflows incrementally. The [inventory](APPS-AND-FEATURES.md) tracks
present code separately from these acceptance gates.

| Step | Deliverable | Exit gate |
| --- | --- | --- |
| 1. Populated demo, shared importer and legacy baseline | Keep useful content; add versioned labeled data packs, minimum record schemas and a CLI importer with preview/replay protection; inventory curedao-api workflows, capture reference fixtures and import eligible historical results with explicit status | One bounded public view reads validated imported records; labels/links survive charts and exports; reruns preserve edits and avoid duplicates; source/permission checks, private/public isolation and demo/source-backed separation pass; reference scope and unknowns are recorded |
| 2. Reproduce the core loop and enable agent curation | Implement tracking/import -> history/chart -> predictor search -> personal/population study -> report/export, reminders and selected connectors; add ratings/trial discovery and scoped MCP/admin adapters over the same importer | End-to-end workflow and numerical comparisons pass for the selected scope; reviewed differences remain explicit; adapters enforce the same validation, access and publication rules; broader parity checklist remains open until verified |
| 3. Participation and community pilot | Structured patient reports, observational protocol wizard and reviewed join flow; approved community-source ingestion, reviewed extraction, separate scores and source-linked drill-down | Consent/protocol versioning, source approval, duplicate handling, withdrawal and deletion tests pass; users can inspect summary -> report -> source and follow report/track -> discover/propose/join without treating interest as external enrollment |
| 4. dfda.earth cutover | Tracking MCP, REST, trial search and text logging in the base app; migrate the domain and accepted replacement surfaces incrementally | Auth/account migration and user-directed data transfer tested; Optimitron email dependency removed; redirects, connector reconnection and rollback verified; unreplaced legacy workflows remain reachable and are not claimed complete |
| 5. Living analyses | Reviewed compatible study synthesis and source-refresh/review pipeline, building on step 2 | Included/excluded study table, overlap handling, bias review, uncertainty, known-answer tests and versioned publication/retraction work; not dependent on clinic federation |
| 6. Independent installation pilot | Same release with configurable branding and supported deployment packaging | One independent clinic can install, operate, export, back up/restore and upgrade without a fork; cross-operator isolation tested; no federation required |
| 7. Optional clinic data exchange | `ClinicSummary`, installation identity, authenticated submissions, review and publication; reuse the evidence pipeline's compatible analysis methods | Sender/receiver privacy threat-model review and adversarial release tests pass, plus replay/revocation/overlap/withdrawal tests; no raw records sent |
| 8. Legacy retirement | Complete the agreed curedao-api feature baseline, move only authorized records and retire superseded legacy services | Every inventoried workflow is accepted or explicitly deferred/retired by the product owner; study/variable links and clients have a tested continuity path; user choice/export, reconciliation, retention/nonresponse policy and rollback/archive plan approved |

MCP/admin adapters follow the importer once scoped authentication is ready; they
do not block the first demo or numerical reproduction work. Steps 3 and 5 can
develop in parallel with cutover when their prerequisites are met; they must not
delay a clearly labeled, useful demo and incremental improvement
of its estimates. Independent hosting and federation are not prerequisites for the
first useful hosted product. Retire legacy services when their migration gates pass,
not merely because a later step number has been reached; step 8 can happen before
optional steps 6 and 7. Detailed tests live in the [evidence specification](EVIDENCE-AND-EXCHANGE.md#acceptance-tests-required-with-implementation).

### Next implementation slice

The full medical dataset is now copied and connected to the condition/treatment
views. The first presentation slice is implemented: condition/synonym search,
comparison cards, shared Outcome Labels, cost breakdowns and snapshot regimens.
Next finish the source/redistribution review and extend the useful public journey
with trial discovery. Cross-condition catalog/reference browsing and remaining
metadata displays are still planned; the whole Optimitron app has not been migrated.
One source-linked trial comparison is also
implemented; next review another eligible study and endpoint compatibility before
pooling, following the [trial-results plan](#clinicaltrialsgov-results).
Implement only the required contracts and the shared
importer's validate/preview/apply/status path; and render imported publication
records with persistent origin labels and source links. Test replay, conflicting
revisions, private-data rejection and preservation of existing user records.
Capture one representative curedao-api study's reference inputs/settings/results
in parallel, subject to data access, so the next slice can reproduce its calculation
and report. Unavailable private inputs do not block the demo-pack slice.

After that foundation, connect MCP/admin clients and extend the legacy tracking/
analysis loop. This sequence does not require all twelve contracts, a full Reddit
integration, autonomous agent infrastructure or clinic federation before any useful
feature ships. No calendar dates are promised until implementation is scoped.

## Rules for published numbers

These apply to every publication, including the first MVP:

- Independent installations send approved clinic aggregates only. Suppress small counts (1–10) with null/reason, not zero; complementary cells and derived statistics also require review. This floor is not an anonymity guarantee and does not erase published trial data.
- Clinic release privacy must cover repeated releases, overlapping cohorts, multiple recipients and all outputs. Fixed periods or rounding alone do not establish safety; choose and test a threat model/release policy before sharing. Differential privacy, if chosen, needs contribution bounds and budget accounting. See the [privacy gate](EVIDENCE-AND-EXCHANGE.md#clinic-release-privacy).
- Every outcome declares which direction is better.
- Use Wilson intervals for simple binomial proportions where assumptions apply; other estimates, clustered/repeated observations and privacy-noised counts need appropriate methods. Intervals do not correct selection bias.
- Retain the proposed 30 distinct patients / 3 independent sources minimum only as an initial eligibility floor for a future clinic-network ranking, with the definitions/version published. It is not a validity guarantee, a community-comment threshold, or a ban on showing a single study. Unknown cross-site overlap blocks a distinct-patient claim. No universal treatment ranking combines all evidence types.
- Every number identifies its origin: illustrative example, provisional model/AI estimate, or source-backed result, plus the evidence type where applicable. Show its basis, time window, review status, method and denominator where applicable; explicitly mark unknowns. Trial results, published reviews, clinic observations, personal analyses, patient ratings and community reports remain distinguishable; only compatible study estimates enter a documented synthesis.
- AI-generated estimates are allowed in the public demo as clearly labeled current best estimates, not established clinical facts or treatment advice. Preserve useful content and improve it as better data arrives. Illustrative values, modeled assumptions, sample sizes and citations must not masquerade as observed records or verified sources. AI-assisted extraction preserves what the source actually says; estimation is a separate, labeled output. Neither model estimates nor demo records enter empirical pooling or actual patient/study counts.

## Remaining new work

The inventory distinguishes present screens/actions from operational workflows.
The following remain new work:

- A parser that turns posted trial results into comparisons between study groups
- Source-permission tracking, community ingestion/review, normalized evidence contracts, deduplication, and deletion propagation
- Versioned demo packs and one validated importer, followed by scoped MCP/admin clients, batch previews/status, replay protection and separate publication permissions
- Versioned study wizard, applicable review gates, consent/enrollment state transitions and withdrawal/export workflows
- Reviewed clinic privacy controls before anything leaves an installation, including cross-release and overlapping-cohort protection
- Installation registration and identity, authenticated clinic aggregate submission, and clinic data exchange administration
- Reviewed compatible meta-analysis, provenance-linked releases and retraction/recomputation
- Reproduction of curedao-api's personal/population analyses, predictor search, charts and generated reports, including lineage, parity fixtures and reviewed corrections
- Reviewed treatment-effect estimation for clinical records. Legacy code already includes within-person correlations, descriptive baseline/follow-up comparisons and population aggregation; those capabilities do not by themselves establish causal effects or replace a design-specific estimator.
- Packaging for an independent installation that a clinic can operate itself

## Open decisions

1. **Existing tracking data.** How to ask people with data in the legacy app or in dfda.earth's tracking whether to move it into their personal health workspace, and what happens to data from people who don't answer.
2. **Source approvals.** Which community sources permit the intended processing, retention and publication, and on what terms? No approval is assumed for Reddit.
3. **Methods and review ownership.** Name accountable reviewers for terminology, extraction, statistical methods, study approvals and privacy releases before their respective publication gates.
4. **Independent installation.** Select/test the supported hosting stack, update ownership and auth/identity handoff; a locally encrypted personal client remains a separately scoped design.
5. **Federation security/privacy profile.** Approve the release policy, overlap handling, signing/auth scheme and downstream withdrawal behavior before implementing public clinic exchange.
