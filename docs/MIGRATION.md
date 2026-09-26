# Migration plan

**Status:** implementation roadmap, updated 2026-09-26. The base app exists;
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

Use an adjacent label such as **"Current best estimate - AI-generated, not clinically
validated"**, with its basis, limitations and update date. "Best" means the demo's
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

## Where things are today

| Repository | What it has | Runs at |
| --- | --- | --- |
| `mikepsinn/dfda` (this repo) | [`apps/web`](../apps/web): Next.js and Supabase app for patients, providers and research partners. [`packages/legacy-import`](../packages/legacy-import): tools for moving data out of the legacy MySQL database. | prototype.dfda.earth |
| `mikepsinn/crowdsourcing-cures` (private) | Organization homepage, patient-rating Treatment Rankings, trial search, articles | crowdsourcingcures.org |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | `apps/dfda`: condition and treatment pages (the numbers are AI estimates), trial search, and an MCP server and REST API for personal tracking. It shares optimitron.com's database and sign-in. `packages/optimizer`: N-of-1 analysis. `packages/tracking`: measurements and reminders. `packages/data`: wearable importers, a ClinicalTrials.gov client, a condition list. | dfda.earth |
| `mikepsinn/curedao-api` (private) | Functional reference: PHP/AngularJS tracking app, accounts/OAuth, connectors, reminders, MySQL records, personal and population time-series analyses, charts and generated study reports | app.dfda.earth, studies.crowdsourcingcures.org |

## The base: apps/web

It already has:

- Sign-in through Supabase Auth, and its own OAuth server (authorization and token endpoints with PKCE, and client registration for developers)
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
| MCP server: 11 tools for measurements, reminders and notifications | A new `/api/mcp` route over the web app's existing measurement and reminder code | Signs in through the web app's own OAuth server, which needs three changes first: dynamic client registration, the standard `.well-known` metadata, and a token endpoint that accepts form-encoded requests (it reads only JSON today, and OAuth clients send forms). The existing actions get their database client from the Supabase session cookie, so the route builds one from the bearer token instead of calling them as they are. |
| REST API (`/api/v1`: measurements, reminders, notifications, variables) and its generated OpenAPI document | Next to the existing OpenAPI route | Same auth as the MCP server |
| Trial search | The existing `find-trials` page, using `packages/trials` | optimitron's ClinicalTrials.gov client replaces the web app's unused helper |
| Landing, about and FAQ content | Existing public pages | Copy only |
| Condition and treatment pages and AI estimates | Adapt useful content and estimates into the existing condition/treatment pages | Preserve demo coverage with explicit current-best-estimate labels and available generation/source metadata. Add patient ratings and trial results as distinct views, then improve or supersede estimates; do not exclude content simply because AI generated it. |
| 6 unit tests | With the features they cover | |

**What stays in optimitron**

- `packages/tracking`, `packages/db` and `packages/data`, which optimitron.com and the other sites use. dfda doesn't depend on them; they aren't published.
- The original shared medical dataset in `packages/data`, which optimitron's database seed also uses. dFDA takes a versioned copy of useful estimates and their available metadata, plus the condition list and ICD-10 codes, without deleting the shared source or depending on Optimitron's runtime database.
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
| Trial search | Not moved | It has its own tested ClinicalTrials.gov client; `packages/trials` uses optimitron's instead. |
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
- Start with reviewed adverse-event tables, preserving participants affected, at-risk denominators, reporting thresholds and observation windows. Events are not people; unreported events are not zero; not every comparator is placebo.
- Compare study groups, not rows. An effect is the treatment group against the comparison group on the same outcome measure and time frame. Use the trial's own posted comparison where there is one. Single-group studies give no comparison and are shown as such.
- Map each outcome measure to an outcome in the shared health vocabulary, with its unit and which direction is better, before pooling across trials. This is the hard part: every trial names and measures its outcomes its own way.
- Pool only compatible estimates using reviewed methods, with explicit handling of study design, uncertainty, shared controls and overlapping cohorts. Shared analysis code can later serve clinic summaries, without mixing the evidence types or assuming identical statistical models.
- Label source results as trial-reported; label calculated outputs as dFDA analyses of those results. Link NCT IDs, source versions, included/excluded studies, and method versions.

The old parser in optimitron (`apps/dfda/lib/fetch-trial-results.ts`) is not reused. It treats the first two numbers in a results table as before and after, which usually compares two different rows. Only 84 of the 5,776 outcome values in optimitron's medical data came from it.

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
| `apps/web` demo data | Supabase seeds | Retain useful examples with persistent example-data labels and separation from actual patient/study records; distinguish illustrative seeds from provisional estimates. Improve the demo rather than clearing it before cutover. |

## Order

| Step | Deliverable | Exit gate |
| --- | --- | --- |
| 1. Demo clarity and legacy baseline | Preserve useful demo content; label examples, provisional estimates and observed-data analyses; inventory curedao-api workflows, capture reference fixtures and import eligible historical study results with their reproduction status; establish provenance, vocabulary and access boundaries | Demo stays populated; labels persist on cards/charts/exports; reference scope and unknowns are recorded; historical displays have permission/display review and private/public authorization tests pass |
| 2. Reproduce the core loop and improve evidence | Implement the bounded tracking/import -> history/chart -> predictor search -> personal/population study -> report/export loop, reminders and selected connectors; add patient ratings, trial discovery and better references alongside existing estimates | End-to-end workflow, reconciliation and numerical tests pass for the selected scope; differences/corrections are documented, imported versus reproduced results remain distinct, and incomplete coverage does not block the demo; broader parity checklist remains open until verified |
| 3. Participation and community pilot | Structured reports, personal tracking, observational protocol wizard and reviewed join flow; limited community-source ingestion only when approved | Consent/protocol versioning, withdrawal and deletion tests pass; users can follow evidence -> report/track -> discover/propose/join without treating interest as external enrollment |
| 4. dfda.earth cutover | MCP, REST, trial search and text logging in the base app; migrate the domain and accepted replacement surfaces incrementally | Auth/account migration and user-directed data transfer tested; Optimitron email dependency removed; redirects, connector reconnection and rollback verified; unreplaced legacy workflows remain reachable and are not claimed complete |
| 5. Living analyses | Reviewed compatible study synthesis and source-refresh/review pipeline, building on step 2 | Included/excluded study table, overlap handling, bias review, uncertainty, known-answer tests and versioned publication/retraction work; not dependent on clinic federation |
| 6. Independent installation pilot | Same release with configurable branding and supported deployment packaging | One independent clinic can install, operate, export, back up/restore and upgrade without a fork; cross-operator isolation tested; no federation required |
| 7. Optional clinic data exchange | `ClinicSummary`, installation identity, authenticated submissions, review and publication; reuse the evidence pipeline's compatible analysis methods | Sender/receiver privacy threat-model review and adversarial release tests pass, plus replay/revocation/overlap/withdrawal tests; no raw records sent |
| 8. Legacy retirement | Complete the agreed curedao-api feature baseline, move only authorized records and retire superseded legacy services | Every inventoried workflow is accepted or explicitly deferred/retired by the product owner; study/variable links and clients have a tested continuity path; user choice/export, reconciliation, retention/nonresponse policy and rollback/archive plan approved |

Steps 3 and 5 can develop in parallel with cutover when their prerequisites are
met; they must not delay a clearly labeled, useful demo and incremental improvement
of its estimates. Independent hosting and federation are not prerequisites for the
first useful hosted product. Retire legacy services when their migration gates pass,
not merely because a later step
number has been reached. Detailed tests live in the [evidence specification](EVIDENCE-AND-EXCHANGE.md#acceptance-tests-required-with-implementation).

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
