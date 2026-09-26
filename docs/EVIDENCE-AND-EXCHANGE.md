# Evidence sources, studies, and exchange contracts

**Design specification, 2026-09-26.** These modules, contracts, and workflows
are planned unless the [inventory](APPS-AND-FEATURES.md) says otherwise. This
document owns evidence semantics and exchange requirements; [architecture](PRODUCT-ARCHITECTURE.md)
owns app boundaries; [MIGRATION.md](MIGRATION.md#order) owns delivery order.
No live source ingestion, clinical validation, or privacy guarantee is established
by this documentation change.

## Demo estimates and progressive improvement

The immediate product is a demonstration of what dFDA can make possible. Preserve
useful AI-generated content and numbers, clearly identify them as provisional, and
improve their basis as patient reports, published research and trial results become
available. There is no blanket removal rule or requirement to replace every estimate
before the demo is useful or public.

Keep three origins distinct, independently of a record's privacy classification:

- **Illustrative example:** synthetic/seed data used to demonstrate a screen or
  workflow. Label it "Example data"; simulated patients, counts and citations are
  not actual observations, participants or verified references.
- **Provisional model estimate:** an AI/model-generated current best estimate, with
  an adjacent label such as "Current best estimate - AI-generated, not clinically
  validated." This is the demo's provisional estimate, not a claim of medical
  consensus or suitability for treatment decisions. State the assumptions, supporting
  sources if available, generation method/version/date where known, and limitations.
  Unknown generation history stays unknown; an unsupported model guess is visibly
  unvalidated, not silently promoted to a source-backed result.
- **Source-backed result:** an extracted observation or documented calculation from
  eligible source records, with its evidence type, input versions and review status.
  This includes statistics fitted to recorded time-series data, even when software
  generates the analysis and its prose automatically. Source-backed does not by
  itself mean causal, unbiased, reproduced or clinically validated.

An app-level demo notice supplements, not replaces, labels on each card, chart,
comparison and exported/API record. Show meaningful uncertainty where supported;
otherwise say "uncertainty not quantified." A model's self-rated confidence is not
a calibrated confidence interval or evidence-certainty percentage. Avoid unsupported
precision. Placeholder references remain labeled examples until replaced by verified
citations; never invent supporting studies or imply a source reports a model's number.

Use planned `ModelEstimate` records for provisional model-generated estimates and
`DemoExample` records for synthetic illustrations. Both belong to `packages/evidence`,
but have separate schemas and fixed origins: `model_estimate` and `illustrative`.
Generation/review/persistence belongs to `apps/web/lib/evidence`, with separate
logical records/publication views from actual patient and study data. These contracts
are not implemented today. Generating an example with AI does not make it a best
estimate; its intended use determines the contract.

Using a statistical model is not, by itself, a reason to use `ModelEstimate`.
Data-derived study calculations belong in `TimeSeriesAnalysis` or `StudyEffect`
as appropriate, with their design, assumptions and methods recorded. `ModelEstimate`
is for a separately presented provisional estimate, not a catch-all for regression,
correlation, automated reports or AI-assisted descriptions of recorded results.
Never fill missing fields in a `StudyEffect` or `PatientReport` with unlabeled model
output; a derived estimate references its inputs without altering those source facts.

Improve one bounded treatment/condition page at a time: attach/check references,
add patient and trial results under their own evidence types, evaluate the model against
compatible source-backed results, and revise or supersede its estimates with dated
versions and an explanation. Different outcomes/populations or rating scales are
not interchangeable replacements. The page can retain explicit estimates where
coverage is incomplete; a correction may also mark a contradicted estimate withdrawn.
AI-written analyses remain useful drafts, not completed systematic reviews merely
because their text says "meta-analysis."

These displays can sit side by side, but model/demo values are not additional
independent evidence and do not enter empirical meta-analysis, patient counts or
enrollment statistics. Demo study interactions are marked simulations; live consent,
recruitment and private-data workflows retain the separate gates below.

## Where each source goes

| Input | Receiving code / normalization | Storage and user-facing destination | Evidence type |
| --- | --- | --- | --- |
| Existing AI/model-generated estimates and associated content | `apps/web/lib/evidence` generation/import/review; planned `ModelEstimate` contract | Versioned estimates; existing demo condition/treatment pages and Outcome Labels | Explicit model-estimate origin, separate from empirical evidence types |
| Illustrative seeds and simulated demo values | App demo fixtures/import; planned `DemoExample` contract | Separate example records; labeled examples on demo pages and simulated workflows | Explicit illustrative origin; not best estimates, actual patients or observed results |
| Reddit and other permitted public discussions | `apps/web/lib/evidence/sources` adapters; `packages/evidence` source and community-report contracts | Restricted source/review store; reviewed source-linked cards on existing condition/treatment pages | Community reports, not enrolled patients or controlled effects |
| ClinicalTrials.gov registry and posted results | `packages/trials` API v2 adapter and new arm/outcome parser; AACT bulk adapter when useful | Registry/study/effect records; existing trial search and public evidence pages | Trial-reported results, separated further by study design |
| Published papers and existing systematic reviews/meta-analyses | Evidence source adapter and reviewed extraction into `StudyEffect` or cited review records | Bibliography, underlying-study links, inclusion/exclusion decisions, and published analysis versions | Published research; reviews are not additional independent participants |
| dFDA patient treatment ratings and longitudinal reports | Existing rating/measurement actions extended by app evidence modules; `PatientReport` contract | Private patient records; explicitly authorized public reports or privacy-reviewed aggregate views | Patient-reported observations |
| Legacy ratings from curedao-api / Crowdsourcing Cures | `packages/legacy-import` migration mapped into the same patient-report model | Preserve original scale, provenance, permissions, collection context, and unknowns | Legacy patient-reported dataset, never relabeled trial evidence |
| Personal and population time-series studies from curedao-api, including studies.crowdsourcingcures.org | `packages/legacy-import` plus app evidence import/review; planned `TimeSeriesAnalysis` contract and `packages/analysis` reproduction | Private personal results; authorized historical/reproduced/corrected study reports, predictor search, charts and public evidence views | Source-backed observational analyses; distinguish within-person from population aggregation, not fictional data or automatically randomized trials |
| Wearables, app exports, and patient-authorized clinical records | `packages/importers` plus receiving app authorization; future provider-specific adapters | Receiving personal/clinic workspace only; analysis outputs require separate publication authorization | Private measurements; not public evidence by default |
| Independent clinic installations | Local analysis and privacy release gate; `packages/clinic-aggregates` validation at sender and receiver | Accepted clinic aggregate submissions and published analysis versions; raw records remain at source | Clinic observational evidence, separate from trials and casual ratings |
| Studies created in dFDA | `apps/web/lib/studies`, existing trial/enrollment actions, `StudyProtocol` contract | Public approved protocol/discovery page; private consent, enrollment, and measurements | Design-specific prospective evidence after analysis/review |

ClinicalTrials.gov supplies registry entries and posted results, **not a ready-made
meta-analysis for every treatment**. dFDA produces a reviewed synthesis from
eligible study estimates; existing published reviews remain separately cited.
Use [API v2 JSON](https://www.nlm.nih.gov/pubs/techbull/ma24/ma24_clinicaltrials_api.html)
for initial search and selected-study ingestion. Use [AACT snapshots/SQL](https://aact.ctti-clinicaltrials.org/landing)
for reproducible bulk work when warranted. Record the snapshot/retrieval date and
NCT ID; API and AACT versions of one study must not count twice. Do not depend on
an unverified headline count of studies with results.

## Time-series studies from recorded data

Reproducing the useful curedao-api app and study generator is an explicit product
goal; see the [functional baseline and acceptance plan](MIGRATION.md#what-comes-from-curedao-api).
The old studies are eligible inputs to the new product, not archive-only material.
Import permitted historical results first, then reproduce and improve the methods,
charts and explanations. Do not replace useful observed-data analyses with AI
guesses merely because the old reports were generated automatically.

Preserve the original report URL/ID, analysis record/version where available,
exposure and outcome definitions, units, time range, method settings, counts,
numerical results, generation date and review status. Missing source rows or method
versions are explicit reproducibility limitations, not invented metadata. Retain
original results only as permitted and link revised versions to their predecessors.
The migration must distinguish:

- **Imported historical result:** reported by the legacy system, not yet reproduced
  here. It can appear after permissions and display review with "Legacy automated
  observational analysis - reproduction pending" and known limitations.
- **Reproduced result:** rerun against the identified reference inputs and method,
  meeting documented numerical tolerances. This is an engineering verification,
  not proof of a causal effect or clinical validity.
- **Corrected/new-method result:** versioned recalculation with documented changes,
  inputs, validation and a reviewed explanation of differences. Preserve which
  result a source page or earlier export actually reported.

Keep import/reproduction status, scientific review, method version and publication
approval separate; publishing a historical result does not mark its calculations
validated. If inputs are unavailable, it remains an imported result. An AI-written
explanation references the numerical result it describes; unsupported inferences
must not become measured findings. Clearly labeled provisional estimates may sit
alongside these results under the separate estimate policy.

### Analysis meaning and comparison rules

- Identify **within-person observational analysis** versus **population aggregation**.
  A personal correlation report is not automatically a randomized N-of-1 trial;
  a population summary is not automatically a meta-analysis of clinical trials.
- Preserve preprocessing/resampling, missing-data rules, exposure/outcome pairing,
  onset delay, duration of action, comparison/baseline definitions and aggregate
  weights. Name distinct people, measurements and paired observations separately;
  paired observations are not independent participants. Account for serial
  dependence, confounding, lag searches and multiple comparisons when interpreting
  uncertainty. A reused legacy p-value or interval is not automatically calibrated.
- Preserve metric identities and formulas: correlation, absolute change, relative
  percent change, percentage-point change and any heuristic score are different
  quantities. A field named `statistical_significance` is not assumed to be a
  p-value. Missing uncertainty remains unknown; do not infer it from a quality score.
  Old "optimal daily value" fields remain descriptive legacy calculations pending
  review, not prescriptive doses or established causal optima.
- Drive cards, charts, report prose and exports from the same versioned result.
  Conflicting p-values, denominators, units or interpretation trigger reconciliation
  and visible limitations; do not silently choose whichever looks strongest.
- Use these findings for personal exploration, separate observational comparisons,
  evidence discovery and study proposals. Only transform a compatible, reviewed
  estimate into `StudyEffect` when design, comparison, uncertainty and dependence
  support the intended synthesis. Do not force a correlation into an RCT effect
  size, pool it with ratings, or use generated prose as another study.
- Track input/cohort lineage and overlap across personal results, population
  reports, repeated windows and other sources. Many relationship pages from the
  same people do not add independent participants. Unknown overlap prevents an
  asserted distinct-person total or pooling that depends on independence.

### Records, privacy and publication

`SourceRecord` holds original-source provenance; `TimeSeriesAnalysis` holds the
derived numerical result, input lineage, settings and reproduction status;
`PublishedAnalysisVersion` identifies the reviewed publication and its included
analysis revisions, methods and limitations. Historical-publication approval can
permit a clearly labeled imported result without claiming the new engine has
reproduced it. Corrections and withdrawals propagate across all three.

The app owns storage, authorization, analysis jobs and rendering; shared
`packages/analysis` owns deterministic calculations. Personal results and raw
measurement series stay private unless separately authorized for a specific use.
Public projections expose only approved fields, without raw rows or person-level
lineage identifiers; review re-identification risks in small cohorts and charts.
An existing public URL is not permission to publish its underlying health records.
`TimeSeriesAnalysis` is not a bypass for clinic release controls: clinic-to-clinic
aggregate submissions still use `ClinicSummary` and its privacy gate. Personal
export is a separate authorized `PersonalDataExport` path, not federation.

## Evidence lifecycle and storage

This lifecycle governs source-backed evidence. Demo/model estimates follow the
separate generation, labeling and revision policy above; they do not need to claim
reviewed empirical inputs to be displayed as provisional estimates.

1. **Authorize the source:** record approved purpose, access method, retention,
   attribution, redistribution, and automated-processing permissions. An available
   URL does not authorize unrestricted collection or sending content to an LLM.
2. **Ingest idempotently:** save source identity/version, canonical link, retrieval
   time, and permitted payload. Queue cursor-based refreshes with rate limits,
   backoff, checkpoints, and per-record errors; retries must not create new evidence.
3. **Normalize and review:** map entities/units, retain source locations, mark
   unsupported claims and uncertain matches, identify overlaps, and validate
   source-specific records. Quarantine ambiguity instead of inventing values.
4. **Compute or identify historical results:** for new calculations, run a versioned
   deterministic method against explicitly selected reviewed inputs; store exclusions,
   denominators, uncertainty and limitations. Imported historical analyses retain
   their source-reported values and reproduction status, not a false rerun claim.
5. **Publish:** release approved views/exports with source links, method and input
   versions, evidence-type labels, and review status. Unknown is visible, not converted to zero.
6. **Correct or withdraw:** deactivate affected inputs, invalidate caches and search
   indexes, propagate notices to permitted recipients, and recompute affected outputs.

Use the existing deployment's PostgreSQL/Supabase storage, with separate logical
stores and enforced permissions, not a database per source:

- **Private:** identities, consent/enrollment, personal measurements, private ratings,
  clinician access grants, and source-to-person links. No public query joins.
- **Restricted staging:** source payloads where permitted, extraction/review records,
  deduplication decisions, mappings, job history. Large permitted files go in private
  object storage, referenced by database records, not in Git.
- **Published:** approved source metadata/excerpts where allowed, aggregate statistics,
  public protocols, published analysis versions, and distinctly labeled estimate/example views.
  Estimate/example publication does not certify empirical validity. A publication
  view is an allowlist, not a serialization of an internal row.

Logical names such as `source_records`, `evidence_reports`, `time_series_analyses`,
`study_effects`, `model_estimates`, `demo_examples`, `published_analysis_versions`,
and `exchange_submissions` describe planned entities, not existing SQL tables.
Reconcile them with the app schema before writing canonical migrations. Logs and
queues use opaque IDs rather than health narratives.

Reproducibility does not justify retaining deleted/restricted content forever.
Keep version history only while permitted; erase payloads, extracts, embeddings,
and derived personal data when required. Retain minimal non-identifying withdrawal
metadata only when permitted, and mark prior releases withdrawn/unreproducible if
inputs can no longer be retained. Do not preserve prohibited content in backups,
fixtures, hashes, or an "immutable" public archive; define backup expiry and restore
deletion replay. Explain limits on recalling already downloaded public releases.

### Reddit access gate

Reddit's [Data API Terms](https://redditinc.com/policies/data-api-terms) constrain
approved use, retention, redistribution, and AI-related rights; some uses require
a separate agreement. API access alone is not approval for this analysis pipeline.
Confirm the intended extraction, health-data processing, publication, and processor
use before enabling the adapter. No scraping workaround, unsolicited recruitment
messages, model training, or unrestricted content mirror is part of this plan.
If access is unavailable, continue with permitted source links and first-party
reports; do not claim a user-submitted link grants processing rights over its text.

## Community reports and separate scores

Extract a claim about a **treatment + condition + outcome**, not generic sentiment
toward a drug. A report may contain multiple claims but is not multiple people.
Preserve explicit dose/route, timing/duration, baseline, reported change, harms,
co-interventions, discontinuation, and follow-up when actually stated. Distinguish
firsthand experience, hearsay, questions, quotations, and promotional content.
Keep mixed, no-change, worse, and unknown reports, not just positive anecdotes.

AI may propose structured extraction with exact source locations and a recorded
model/prompt/parser version. Extraction must not invent doses, effect sizes or sample
sizes and attribute them to the source. Separately labeled model estimates are allowed
under the demo policy; they are not extracted facts. Extraction confidence measures
extraction reliability, not truth or treatment efficacy. Treat source text as untrusted data, never executable
instructions. Evaluate extraction against a reviewed sample before publication;
ambiguous/high-impact claims need human review and users need a correction route.

Track duplicate/repost clusters and repeated follow-ups within the permitted
source context. Do not identify people across sites or infer sensitive traits.
Accounts and comments are not verified unique patients. When a person voluntarily
links their own earlier post, flag overlap with their dFDA report rather than
counting both as independent support. Unresolved cross-source overlap stays visible.

| Display | Initial definition | Required caveat |
| --- | --- | --- |
| Reported benefit | Counts of better/no-change/mixed/worse/unknown; optional better / reports with an explicit direction, under a versioned coding rule | Fraction of selected reports, not probability a treatment works |
| Reported harms | Counts by harm and discontinuation; if a fraction is shown, name the reviewed-report denominator and missing-report count | A mention rate is not incidence; silence is not absence of harm |
| Patient rating | Original 0–10 distribution and count within comparable condition/treatment contexts; longitudinal follow-ups shown separately | Not a clinical effect size, and not converted into an invented percent benefit |
| Report completeness | Versioned checklist for condition/outcome, exposure, duration, baseline, follow-up, and co-interventions; show filled items / applicable items | Completeness is not credibility; unknown/not-applicable handling is explicit |
| Evidence strength | Separate study-design, risk-of-bias, consistency, precision, and directness assessments, with reviewer/rubric version | No LLM-generated "certainty percentage" or automatic high-quality badge |
| Research priority | Initially transparent filters: evidence gaps, community interest, existing recruitment, and available study designs | A queue for investigation, not a treatment recommendation or safety score |

Upvotes/helpfulness can help find readable reports but are not efficacy weights.
No universal score mixes these dimensions or pools anecdotes with randomized
trials. Default pages show the evidence types and user-selectable comparisons.
Every source-derived calculated number has its eligible input set, exclusions, denominator,
method version, date, and a path back to permitted original sources. Suppress an
empirical score when its denominator or required fields are missing; any separate
model estimate retains its own label and limitations instead. Confidence intervals
do not remove selection bias, confounding, coordinated promotion, or missingness.

## Trial extraction and living meta-analysis

Preserve a study's design, analysis population, arm IDs, comparator, outcome
definition/scale/direction, time point, analyzed sample size, effect measure,
estimate and uncertainty. Link each extracted number to a registry field/table or
paper location. Prefer a valid reported comparison; any derived estimate records
its formula and source inputs. Never treat the first two table numbers as pre/post.
Enrollment totals are not automatically the denominator for a measured outcome.

Start with reviewed adverse-event tables, but distinguish participants affected
from event counts, at-risk denominators, collection methods, reporting thresholds,
seriousness, and observation windows. Missing tables or unreported events are not
zero. Neither single-arm rates nor uncontrolled before/after changes establish a
causal treatment effect. Sparse/zero-event data need an explicitly supported method.

For each synthesis, record a question, eligibility/search strategy and date,
screening/exclusion log, risk-of-bias assessment, and compatible outcome/comparator/
time-window groups. Link publications, registry entries, review citations, and
updates to underlying study/cohort identities. Do not pool a review's estimate
alongside its constituent studies or count shared control arms repeatedly.

`packages/analysis` implements reviewed methods with known-answer tests: suitable
effect measures and uncertainty, explicit fixed/random-effects choices, dependence
handling, heterogeneity and sensitivity analyses. Unsupported designs or insufficient
uncertainty stay unpooled. Publish forest plots and input tables with each release;
label partial coverage as a scoped synthesis, not an exhaustive systematic review.
These safeguards follow the principles in the [Cochrane meta-analysis handbook](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10).

Source updates trigger a candidate new analysis, not automatic publication of new
clinical conclusions. Human review approves the interpretation and release.
Trial, clinic-observational, personal N-of-1, patient-rating, and community-report
outputs remain separately identifiable even when displayed on one Outcome Label.

## Create and join studies

Build on the existing trial creation, enrollment, measurement, and reminder code;
its presence does not prove these gates already work. The wizard starts from a
treatment/condition page and offers:

- **Personal tracking:** choose outcomes and a measurement schedule. This does not
  assign treatment or label a self-tracking record a randomized clinical trial.
- **Community observational study:** a reusable protocol for tracking existing
  exposures and outcomes, with collection/privacy review before recruitment.
- **Interventional proposal:** draft a protocol for qualified review; no automatic
  treatment assignment, recruitment, or claims of clinical approval.

A draft captures question, design, sponsor/operator, eligibility, outcomes and
time points, measurement instruments, exposure/comparator, follow-up, analysis
plan, privacy/retention, contact and safety-escalation arrangements. Templates can
prefill a draft but cannot approve it. Add review decisions and applicable ethics,
regulatory, and clinical oversight requirements before opening recruitment; the
label "observational" does not itself establish an exemption. See [OHRP informed
consent guidance](https://www.hhs.gov/ohrp/regulations-and-policy/guidance/faq/informed-consent/index.html).

Protocol states: draft -> review -> approved -> recruiting -> active -> closed ->
results-reviewed -> published, with paused/withdrawn states and audited amendments.
Review must determine which approvals apply; the platform does not certify them.
For joining: interest -> eligibility review -> consent to a specific protocol
version -> enrolled -> follow-up -> completed/withdrawn. Enforce transitions on
the server. Amendments specify whether re-consent is required.

External trials link to the registry/sponsor's application route; clicking interest
in dFDA is not enrollment in that external trial. Reddit authors are never enrolled
from scraped content. A person may voluntarily review their own prefilled report
and separately opt into a study. Private tracking, clinician sharing, public report
publication, study participation, and aggregate contribution require distinct
choices. Explain withdrawal/retention limits before consent; prevent future use
when revoked as applicable. Participants can see their data and export it.

## Exchange formats and their owners

**Planned v1 contracts, not implemented schemas or an established industry
standard.** Each listed owner will keep one canonical JSON Schema under
`schemas/v1/`, generated TypeScript types/runtime validators, and synthetic valid/
invalid fixtures under `fixtures/v1/`. The first implementing PR must supply the
schemas, compatibility tests, and consumer integration together.

| Contract / proposed schema file | Owner | Minimum payload and boundary |
| --- | --- | --- |
| `SourceRecord` / `source-record.schema.json` | `packages/evidence` | Source system/native ID, URL, revision/retrieval date, permitted payload reference, access/retention policy, provenance locations; restricted fields stripped from public views |
| `CommunityReport` / `community-report.schema.json` | `packages/evidence` | Source references, claim context/direction, explicitly stated exposure/timing/harms, unknowns, review/extraction versions, duplicate-cluster status; public projection only where permitted |
| `PatientReport` / `patient-report.schema.json` | `packages/evidence` | Original rating scale, context, time points, measured/self-reported distinction, local subject/report IDs and authorization reference; private on submission, separately authorized publication |
| `StudyEffect` / `study-effect.schema.json` | `packages/evidence` | Underlying study/cohort IDs, design, arms/comparator, population, outcome/unit/direction/time point, estimate and uncertainty or sufficient statistics, derivation/provenance, bias/review status |
| `TimeSeriesAnalysis` / `time-series-analysis.schema.json` | `packages/evidence` | Fixed `origin: source_backed`; observational design and personal/population scope; original report/analysis IDs and URL, input IDs/revisions or explicit unavailability, exposure/outcome/units/time range, preprocessing/pairing/lag/duration and baseline/comparison definitions, distinct person/measurement/pair counts, named metrics/estimates/uncertainty, aggregation weights/cohort overlap, method/code versions or unknowns, reproduction/review status, limitations and supersession; private lineage is excluded from public projections |
| `ModelEstimate` / `model-estimate.schema.json` | `packages/evidence` | Fixed `origin: model_estimate`, condition/treatment/outcome context, value/scale/unit, assumptions, supporting source/input references where available, model/prompt/method version and date or explicit unknowns, uncertainty type/value or unquantified status, review/limitations and supersession; a provisional estimate, not illustrative filler or an observed study/patient record |
| `DemoExample` / `demo-example.schema.json` | `packages/evidence` | Fixed `origin: illustrative`, example purpose/scenario and version, synthetic value or simulated payload with declared shape/units/context, mandatory example label, and generation metadata where known; any mock participants, counts or citations are explicitly fictional, not real private data, verified sources or best estimates |
| `StudyProtocol` / `study-protocol.schema.json` | `packages/trials` | Stable study ID, immutable protocol version, design, eligibility, outcomes/schedule, analysis plan, operator/contact, review status; public approved projection excludes participants and signed consent |
| `PersonalDataExport` / `personal-data-export.schema.json` | `packages/importers` | Manifest, health vocabulary/schema versions, measurements, ratings, permitted personal `TimeSeriesAnalysis` records/report attachments, provenance and units/time zones; preserve analysis input references or explicit unavailable status on transfer; authorized encrypted download/transfer, never a clinic data exchange submission |
| `ClinicSummary` / `clinic-summary.schema.json` | `packages/clinic-aggregates` | Installation/release/cohort IDs, period, design, outcome/comparator, permitted counts/statistics or effect+uncertainty, overlap declaration, privacy policy/version and release approval; no person IDs, narratives or raw rows |
| `PublishedAnalysisVersion` / `published-analysis-version.schema.json` | `packages/evidence` | Input IDs/revisions (including `TimeSeriesAnalysis` where relevant), inclusion/exclusion decisions, health vocabulary/method/code versions or explicit historical unknowns, parameters, results/uncertainty, evidence type, reproduction status where applicable, limitations, review and supersession status; public only after publication gate, which is not a declaration of clinical validity or numerical reproduction |
| `WithdrawalNotice` / `withdrawal-notice.schema.json` | `packages/evidence` | Authorized issuer, target IDs/revisions, effective time, minimal reason category, replacement if any; receiver acknowledgment and affected-release invalidation, no sensitive explanation |

Signed consent, private screening responses, identity mappings, access tokens,
and cryptographic keys stay with the responsible app/operator. A consent reference
in a report is not the signed consent document. Federation is not a mechanism for
transferring those documents. Personal export/import does not transfer active
sessions, clinic privileges, or consent automatically.

### Common envelope and transport

- Every exchange record includes `schema_name`, `schema_version`, namespaced
  `record_id`, `revision`, `producer_id`, `created_at`, `data_classification`, and
  source/input references where applicable. Corrections reference the superseded
  revision. Producer plus record plus revision is the idempotency key; a conflicting
  payload for that key is rejected. References specify revisions, not mutable IDs alone.
- Numeric public projections and exports preserve origin (`source_backed`,
  `model_estimate`, or `illustrative`) separately from privacy classification and
  review status. `ModelEstimate`, `DemoExample` and `TimeSeriesAnalysis` validators
  enforce their distinct fixed origins; a statistical fit to recorded data is not
  reclassified as a provisional AI guess. A value-level origin is required for
  mixed displays; no implicit fallback may relabel an estimate as an observation.
  Demo/estimate records cannot validate as observed `TimeSeriesAnalysis`,
  `StudyEffect`, `PatientReport`, or `ClinicSummary` inputs.
- Canonical treatment/condition/outcome/unit IDs include a health vocabulary version;
  original terminology is preserved. Unmapped entities stay unmapped until reviewed.
  Specify timestamps/time zones, scales, sign conventions, numeric precision, and
  missingness states (`not_reported`, `not_applicable`, `suppressed`, `unknown`).
  A suppressed count is null plus a reason, never zero; never emit NaN/Infinity.
- Use UTF-8 JSON for API records and manifests; JSONL for large record collections.
  Personal export archives contain a manifest, typed JSONL files, and permitted
  attachments with checksums. CSV is an optional human-analysis export with a data
  dictionary, not the lossless canonical format; neutralize spreadsheet formulas.
- Major schema changes require a new version and migration; additive compatible
  changes use documented minor versions. Receivers reject unsupported versions and
  unexpected fields at public/aggregate boundaries. A schema-valid object can still
  fail authorization, scientific-validity, or privacy checks.
- App HTTPS APIs and worker jobs consume these contracts; document actual routes
  through the existing OpenAPI surface when implemented. No new live endpoints are
  promised here. Authenticated installation submissions require scoped credentials, key
  rotation/revocation, replay protection, payload integrity, size limits, acknowledgments,
  and per-record rejection reasons. Select/test the signing/auth profile before federation.
- Native ClinicalTrials.gov JSON and AACT tables are inputs, not competing dFDA
  formats. Add FHIR or other clinical-system adapters only for a concrete integration,
  with its required version/profile and terminology mapping; these dFDA contracts
  do not claim FHIR conformance or replace that system's interchange standard.

### Clinic release privacy

`ClinicSummary` is only for approved aggregates. The existing proposed minimum
cell rule (suppress counts 1–10) is a floor, not an anonymity guarantee. Complementary
cells/totals, rare combinations, repeated releases, overlapping cohorts, other
exchange operators, and exact moments/effect estimates can still disclose information.
Do not send identifying cohort definitions or unsuppressed sufficient statistics.

Before federation, approve a threat model and tested release policy covering all
outputs, cross-release composition, overlap, withdrawals, and permitted queries.
If using differential privacy, specify contribution bounds, clipping, mechanism,
privacy budget/accounting, and uncertainty after noise. Fixed periods or rounding
alone are not an accepted proof. Receivers cannot repair an unsafe source release.
No clinic upload until the sender and receiver both enforce these gates.

## Acceptance tests required with implementation

- Fixture-based schema tests: unknown versions, missing values, units/directions,
  invalid counts, unexpected private fields, corrections, and round-trip personal exports.
- Estimate/example contracts: `ModelEstimate` rejects illustrative origin and
  `DemoExample` rejects model-estimate origin; example generation with AI never
  implicitly promotes it to an estimate. Public projections preserve the distinction,
  and simulated payloads cannot be ingested as actual patient or study records.
- Source replay tests: API/AACT duplicates, papers describing the same cohort,
  comment reposts/follow-ups, missing denominators/results, failed fetches, and deleted sources.
- Known-answer statistics: arm matching, uncertainty, outcome direction, shared controls,
  sparse events, incompatible-study rejection, and score denominators; independent methods review.
- Legacy time-series reproduction: pinned authorized input/reference fixtures,
  personal and population scope, units/time zones, resampling/pairing/lag/duration,
  missing/constant/sparse data, zero baselines, aggregate weights and overlapping
  cohorts. Compare per-metric tolerances and record reviewed corrections rather
  than treating known legacy defects as required behavior; do not run private
  health fixtures in public CI.
- Time-series contracts and presentation: distinguish imported, reproduced and
  corrected versions; missing lineage remains missing. Check person/measurement/pair
  denominators, p-values versus heuristic scores, percentage/percentage-point
  formatting, chart/table/prose/export consistency, source-backed versus estimate
  classification and authorized report export/reimport. No private rows or lineage
  IDs leak through charts, URLs or publication views.
- End-to-end provenance: source-backed numbers resolve to reviewed source/input versions;
  model estimates resolve to their generation/basis record, with unknowns explicit;
  illustrative values remain marked examples. Cards, charts, APIs and exports retain
  these distinctions and exclude unauthorized private fields.
- Demo continuity and improvement: existing useful views remain populated; adding
  reviewed results creates a new version or supersedes compatible estimates without
  silently changing their origin. Test incomplete coverage, unquantified uncertainty, placeholder citations,
  mixed-origin displays and prevention of demo/model inputs entering empirical pooling
  or actual patient/enrollment counts. Labeled estimates do not fail publication solely
  because AI generated them.
- Consent/access tests: cross-patient and cross-clinic denial, researcher access limits,
  protocol-version enrollment, withdrawal, export authorization, and no auto-enrollment.
- Lifecycle tests: retries, failed review, changed sources, deletion through caches/indexes,
  revoked installation credentials, signed submission replay, and downstream withdrawal acknowledgment.
- Tracking-to-study continuity: authorized import/log -> history/edit/chart ->
  predictor search -> personal study -> permitted population report -> share/export
  -> reminders. Edit/delete/withdrawal invalidates affected derived results and
  recalculation/publication views; legacy deep links and rollback remain tested.
- Clinic privacy tests: small/complementary cells, repeated and overlapping releases,
  multiple exchange operators, and attempts to reconstruct suppressed data. Keep federation off
  until review demonstrates the selected release policy satisfies the threat model.
