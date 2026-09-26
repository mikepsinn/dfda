# Migration plan

**Status:** implementation roadmap, updated 2026-09-26. The base app exists;
the extraction, evidence pipeline, independent installation, and federation
below remain planned unless the inventory marks specific code present.

dFDA code and data are spread across four repositories. The plan: [`apps/web`](../apps/web) in this repo (formerly `apps/dfda-node`) is the base. It takes over dfda.earth, and the dfda features in optimitron's `apps/dfda` move into it. This document lists where things are, what moves, what happens to each dataset, and the order of the work. Each step can ship on its own.

Documentation ownership:

- [Product architecture](PRODUCT-ARCHITECTURE.md): one product, deployment/data boundaries, white labeling, and code ownership.
- [Evidence and exchange](EVIDENCE-AND-EXCHANGE.md): external sources, scoring, study workflows, contracts, privacy, and acceptance tests.
- [Apps and features](APPS-AND-FEATURES.md): present code versus extraction candidates and new work.
- This document: migration decisions, publication policy, and the single delivery sequence. New specifications do not mean features have shipped.

## Where things are today

| Repository | What it has | Runs at |
| --- | --- | --- |
| `mikepsinn/dfda` (this repo) | [`apps/web`](../apps/web): Next.js and Supabase app for patients, providers and research partners. [`packages/legacy-import`](../packages/legacy-import): tools for moving data out of the legacy MySQL database. | prototype.dfda.earth |
| `mikepsinn/crowdsourcing-cures` (private) | Organization homepage, patient-rating Treatment Rankings, trial search, articles | crowdsourcingcures.org |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | `apps/dfda`: condition and treatment pages (the numbers are AI estimates), trial search, and an MCP server and REST API for personal tracking. It shares optimitron.com's database and sign-in. `packages/optimizer`: N-of-1 analysis. `packages/tracking`: measurements and reminders. `packages/data`: wearable importers, a ClinicalTrials.gov client, a condition list. | dfda.earth |
| `mikepsinn/curedao-api` (private) | The legacy PHP and AngularJS app: user accounts, OAuth, wearable connectors, reminders, the MySQL database, and the generator for the static studies site | app.dfda.earth, studies.crowdsourcingcures.org |

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
| Personal workspace / Digital Twin Safe role | Patient interface in the hosted app. Local-first storage and operator-blind encryption are not established by these screens. |
| Clinic Node | Provider interface in the same maintained product; an independent installation has its own auth, records, storage, configuration, and credentials. |
| Evidence exchange / aggregator | New ingestion, provenance, compatible analysis, publication, and node administration in app-owned modules/jobs initially. Not another required website; separate restricted processes/services when justified. |

Offer a managed service and optional independently installed, branded copies of
one release. Do not create a fork per clinic or a server per patient. Branding
does not create authorization boundaries or permit changing evidence rules.
Independent aggregators may implement the same contracts; federation is opt-in.
See [product architecture](PRODUCT-ARCHITECTURE.md) for installation gates and
the distinction between a hosted patient workspace and a local encrypted Safe.

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

Node registration and identity, authenticated submissions, contribution
policies, and network monitoring belong to the evidence exchange's administration.
Consent records and aggregate privacy controls remain prerequisites for
sharing clinic data. Public-source ingestion/publishing jobs must not inherit
the existing reminder worker's unrestricted patient-data credentials.

Before it serves dfda.earth, its outcome labels need the same rules as everything else: they currently show demo seed data (including a placeholder citation) and AI-generated numbers.

## What comes from optimitron

Everything dfda-specific leaves optimitron, including dfda.earth's MCP server and tracking REST API. optimitron.com keeps its own MCP server. Moved features are restyled from optimitron's neobrutalist style to the web app's theme.

| Feature in optimitron `apps/dfda` | In `apps/web` | Notes |
| --- | --- | --- |
| MCP server: 11 tools for measurements, reminders and notifications | A new `/api/mcp` route over the web app's existing measurement and reminder code | Signs in through the web app's own OAuth server, which needs three changes first: dynamic client registration, the standard `.well-known` metadata, and a token endpoint that accepts form-encoded requests (it reads only JSON today, and OAuth clients send forms). The existing actions get their database client from the Supabase session cookie, so the route builds one from the bearer token instead of calling them as they are. |
| REST API (`/api/v1`: measurements, reminders, notifications, variables) and its generated OpenAPI document | Next to the existing OpenAPI route | Same auth as the MCP server |
| Trial search | The existing `find-trials` page, using `packages/trials` | optimitron's ClinicalTrials.gov client replaces the web app's unused helper |
| Landing, about and FAQ content | Existing public pages | Copy only |
| Condition and treatment pages | Not moved | They show AI estimates. The web app's own pages show patient ratings instead. |
| 6 unit tests | With the features they cover | |

**What stays in optimitron**

- `packages/tracking`, `packages/db` and `packages/data`, which optimitron.com and the other sites use. dfda doesn't depend on them; they aren't published.
- The AI-estimated medical data in `packages/data`, which optimitron's database seed also uses. dfda takes only the condition list and its ICD-10 codes (see Data).
- The `DFDA_*` constants in the `packages/data` parameters. They are economic-model inputs used by several optimitron sites, not app code.
- The site-kit "how it works" sections that other optimitron sites render. Their links keep pointing at dfda.earth.

**What has to be untangled**

1. **Accounts.** dfda.earth's current accounts are optimitron accounts, and its MCP server only accepts tokens that optimitron.com issues. After the move, people sign in with web app accounts, and MCP connectors reconnect once.
2. **Data.** dfda.earth reads and writes the same database as optimitron.com: users, measurements, reminders, notifications and variables. People who tracked through dfda.earth need a way to bring their data along (see Open decisions).
3. **Email.** Every optimitron site sends email from `no-reply@updates.dfda.earth`. optimitron needs its own sending address before dfda.earth leaves.
4. **Cleanup in optimitron** after the move: `apps/dfda` itself, the dfda site variants in site-kit and `apps/optimitron`, dfda.earth in optimitron.com's list of MCP hosts, the CI build entry, the `pnpm copy` and visual-test scripts, the Vercel project scripts, and the docs that mention `apps/dfda`. optimitron.com's redirects of `/conditions`, `/treatments` and `/find-trials` to dfda.earth can stay.

**Cutover.** dfda.earth switches to the web app once its MCP server and REST API work. If the pages are ready first, the web app can forward `/api/mcp`, `/api/v1/*`, `/.well-known/oauth-protected-resource/mcp` and `/openapi.json` to the old optimitron deployment on a Vercel address until then.

## What comes from crowdsourcing-cures

crowdsourcingcures.org keeps the organization pages (home, initiatives, docs) and drops its health-data pages at the dfda.earth cutover. Before that, two of its features move into the base app.

| Feature in crowdsourcing-cures | In the base app | Notes |
| --- | --- | --- |
| Patient-rating Treatment Rankings: the treatments ranked for each condition, and each treatment's ratings across conditions | The existing condition and treatment pages, which have a ranking component but show demo data | The ratings data moves too (see Data). Rankings follow the rules for published numbers below. |
| Logging measurements by typing: a person writes something like "took 200 mg magnesium, slept badly" and an AI turns it into measurements | Next to the existing photo-to-measurements action | The AI only reads the person's own words and produces no evidence numbers. It saves to the old app today, so it is rewired to the base app's own tables. |
| Trial search | Not moved | It has its own tested ClinicalTrials.gov client; `packages/trials` uses optimitron's instead. |

**Not moved**

- Pages that only show data from the old app at app.dfda.earth: measurement history, variable charts, predictor search, population studies, the reminder inbox, data-import connectors, the Digital Twin Safe link and the reaction-time test. The base app already has its own measurements and reminders, and predictor search and the variable charts get rebuilt on `analysis` later. Remove these proxy pages during cutover, before legacy retirement.
- AI-written pages: the per-condition meta-analyses, the cost-benefit analyses and the research articles. They break the no-AI-numbers rule. Whether crowdsourcingcures.org keeps them, labeled, is a separate decision.
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
- Map each outcome measure to a `codebook` outcome, with its unit and which direction is better, before pooling across trials. This is the hard part: every trial names and measures its outcomes its own way.
- Pool only compatible estimates using reviewed methods, with explicit handling of study design, uncertainty, shared controls and overlapping cohorts. Shared analysis code can later serve clinic summaries, without mixing the evidence lanes or assuming identical statistical models.
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
| `analysis` | Descriptive report scores, N-of-1 statistics, study-effect estimation and compatible meta-analysis | Selected optimitron `packages/optimizer` code; recheck and fix the previously reported small-sample p-value and outcome-direction bugs before adoption. New methods need known-answer tests. |
| `codebook` | Shared names and IDs for conditions, treatments, outcomes and units | The curedao-api variables table, the `apps/web` seeds, and optimitron's condition list with ICD-10 codes |
| `evidence` | Shared source/report/effect/release/withdrawal contracts, provenance and deduplication primitives | New; adapters and persistence remain app-owned |
| `summary-file` | Aggregate-only `ClinicSummary` format and validators, shared by Clinic Nodes and evidence exchanges | New; not the format for comments or personal-data transfer |
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
| Reddit / other permitted public reports | External source, access and processing approval required | Source-linked community lane; retained only as permitted; never silently converted into patient records or enrollment. |
| Published papers, systematic reviews and meta-analyses | Cited publications and permitted full text | Reviewed extraction; connect to underlying study/cohort IDs and avoid double-counting reviews and their studies. |
| New patient ratings, observations and study outcomes | App's private patient/trial tables | Structured context, consent, provenance and protocol versions; publish only authorized reports or reviewed aggregates. |
| Legacy measurements: about 13 million, with per-user and population analyses | curedao-api MySQL | Move a person's data into their Safe only if they choose to (see Open decisions). |
| Tracking data recorded through dfda.earth | optimitron's database | Same as legacy measurements |
| ~15,800 automated N-of-1 studies | Static site generated by curedao-api | Keep as an archive. Don't republish them as evidence. |
| AI-estimated medical data (216 conditions, 969 treatments) | optimitron `packages/data` | Don't migrate the numbers. The condition list and its ICD-10 codes seed the `codebook`. |
| `apps/web` demo data | Supabase seeds | Clear it before dfda.earth points at the app |

## Order

| Step | Deliverable | Exit gate |
| --- | --- | --- |
| 1. Foundation | Remove demo/AI-invented evidence; establish codebook, minimal evidence contracts, consent/access model and tested analysis primitives | Source/mapping fixtures, method tests and private/public authorization tests pass; no production label uses invented numbers |
| 2. Evidence MVP | Real patient-rating views, trial discovery, reviewed results for a bounded treatment/condition scope, source links and separate evidence lanes | Every number traces to eligible input versions and a reproducible method; missing data is explicit; duplicates and permissions checked |
| 3. Participation and community pilot | Structured reports, personal tracking, observational protocol wizard and reviewed join flow; limited community-source ingestion only when approved | Consent/protocol versioning, withdrawal and deletion tests pass; users can follow evidence -> report/track -> discover/propose/join without treating interest as external enrollment |
| 4. dfda.earth cutover | MCP, REST, trial search and text logging in the base app; migrate the domain and redundant health-data surfaces | Auth/account migration and user-directed data transfer tested; Optimitron email dependency removed; redirects, connector reconnection and rollback verified before deleting old routes |
| 5. Living analyses | Reviewed compatible study synthesis and source-refresh/review pipeline, building on step 2 | Included/excluded study table, overlap handling, bias review, uncertainty, known-answer tests and versioned publication/retraction work; not dependent on clinic federation |
| 6. Independent clinic pilot | Same release with configurable branding and supported deployment packaging | One independent clinic can install, operate, export, back up/restore and upgrade without a fork; cross-operator isolation tested; no federation required |
| 7. Optional federation | `ClinicSummary`, node identity, authenticated submissions, review and publication; reuse compatible analysis methods | Sender/receiver privacy threat-model review and adversarial release tests pass, plus replay/revocation/overlap/withdrawal tests; no raw records sent |
| 8. Legacy retirement | Move only authorized legacy records and retire app.dfda.earth | Users have a documented choice/export path; migration reconciliation, retention/nonresponse policy and rollback/archive plan approved |

Steps 3 and 5 can develop in parallel with cutover when their prerequisites are
met; they must not delay replacing invented public evidence. Independent hosting
and federation are not prerequisites for the first useful hosted product. Retire
legacy services when their migration gates pass, not merely because a later step
number has been reached. Detailed tests live in the [evidence specification](EVIDENCE-AND-EXCHANGE.md#acceptance-tests-required-with-implementation).

## Rules for published numbers

These apply to every publication, including the first MVP:

- Clinic Nodes send approved aggregates only. Suppress small counts (1–10) with null/reason, not zero; complementary cells and derived statistics also require review. This floor is not an anonymity guarantee and does not erase published trial data.
- Clinic release privacy must cover repeated releases, overlapping cohorts, multiple recipients and all outputs. Fixed periods or rounding alone do not establish safety; choose and test a threat model/release policy before sharing. Differential privacy, if chosen, needs contribution bounds and budget accounting. See the [privacy gate](EVIDENCE-AND-EXCHANGE.md#clinic-release-privacy).
- Every outcome declares which direction is better.
- Use Wilson intervals for simple binomial proportions where assumptions apply; other estimates, clustered/repeated observations and privacy-noised counts need appropriate methods. Intervals do not correct selection bias.
- Retain the proposed 30 distinct patients / 3 independent sources minimum only as an initial eligibility floor for a future clinic-network ranking, with the definitions/version published. It is not a validity guarantee, a community-comment threshold, or a ban on showing a single study. Unknown cross-site overlap blocks a distinct-patient claim. No universal treatment ranking combines all evidence lanes.
- Every number identifies its source lane, denominator, time window, review status and method. Trial results, published reviews, clinic observations, personal analyses, patient ratings and community reports are distinguishable; only compatible study estimates enter a documented synthesis.
- No AI-invented medical numbers. AI-assisted extraction preserves source values and uncertainty; deterministic calculations can derive numbers from eligible inputs with an auditable method. Demo data stays out of production evidence.

## Remaining new work

The inventory distinguishes present screens/actions from operational workflows.
The following remain new work:

- A parser that turns posted trial results into comparisons between study groups
- Source-permission tracking, community ingestion/review, normalized evidence contracts, deduplication, and deletion propagation
- Versioned study wizard, applicable review gates, consent/enrollment state transitions and withdrawal/export workflows
- Reviewed clinic privacy controls before anything leaves the node, including cross-release and overlapping-cohort protection
- Node registration and identity, authenticated Summary File submission, and evidence-exchange administration
- Reviewed compatible meta-analysis, provenance-linked releases and retraction/recomputation
- A treatment-effect estimator for clinical records (before and after starting a treatment, or treated against a comparison group). The existing engines only compute within-person correlations.
- A Clinic Node that a clinic can install and run itself

## Open decisions

1. **Existing tracking data.** How to ask people with data in the legacy app or in dfda.earth's tracking whether to move it into a Safe, and what happens to data from people who don't answer.
2. **Source approvals.** Which community sources permit the intended processing, retention and publication, and on what terms? No approval is assumed for Reddit.
3. **Methods and review ownership.** Name accountable reviewers for terminology, extraction, statistical methods, study approvals and privacy releases before their respective publication gates.
4. **Independent installation.** Select/test the supported hosting stack, update ownership and auth/identity handoff; local encrypted Safe semantics remain a separately scoped design.
5. **Federation security/privacy profile.** Approve the release policy, overlap handling, signing/auth scheme and downstream withdrawal behavior before implementing public clinic exchange.
