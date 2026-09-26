# Evidence sources, studies, and exchange contracts

**Design specification, 2026-09-26.** These modules, contracts, and workflows
are planned unless the [inventory](APPS-AND-FEATURES.md) says otherwise. This
document owns evidence semantics and exchange requirements; [architecture](PRODUCT-ARCHITECTURE.md)
owns app boundaries; [MIGRATION.md](MIGRATION.md#order) owns delivery order.
No live source ingestion, clinical validation, or privacy guarantee is established
by this documentation change.

## Where each source goes

| Input | Receiving code / normalization | Storage and user-facing destination | Evidence lane |
| --- | --- | --- | --- |
| Reddit and other permitted public discussions | `apps/web/lib/evidence/sources` adapters; `packages/evidence` source and community-report contracts | Restricted source/review store; reviewed source-linked cards on existing condition/treatment pages | Community reports, not enrolled patients or controlled effects |
| ClinicalTrials.gov registry and posted results | `packages/trials` API v2 adapter and new arm/outcome parser; AACT bulk adapter when useful | Registry/study/effect records; existing trial search and public evidence pages | Trial-reported results, separated further by study design |
| Published papers and existing systematic reviews/meta-analyses | Evidence source adapter and reviewed extraction into `StudyEffect` or cited review records | Bibliography, underlying-study links, inclusion/exclusion decisions, and reviewed analysis releases | Published research; reviews are not additional independent participants |
| dFDA patient treatment ratings and longitudinal reports | Existing rating/measurement actions extended by app evidence modules; `PatientReport` contract | Private patient records; explicitly authorized public reports or privacy-reviewed aggregate views | Patient-reported observations |
| Legacy ratings from curedao-api / Crowdsourcing Cures | `packages/legacy-import` migration mapped into the same patient-report model | Preserve original scale, provenance, permissions, collection context, and unknowns | Legacy patient-reported dataset, never relabeled trial evidence |
| Wearables, app exports, and patient-authorized clinical records | `packages/importers` plus receiving app authorization; future provider-specific adapters | Receiving personal/clinic workspace only; analysis outputs require separate publication authorization | Private measurements; not public evidence by default |
| Independently operated Clinic Nodes | Local analysis and privacy release gate; `packages/summary-file` validation at sender and receiver | Accepted summary submissions and public analysis releases; raw records remain at source | Clinic observational evidence, separate from trials and casual ratings |
| Studies created in dFDA | `apps/web/lib/studies`, existing trial/enrollment actions, `StudyProtocol` contract | Public approved protocol/discovery page; private consent, enrollment, and measurements | Design-specific prospective evidence after analysis/review |

ClinicalTrials.gov supplies registry entries and posted results, **not a ready-made
meta-analysis for every treatment**. dFDA produces a reviewed synthesis from
eligible study estimates; existing published reviews remain separately cited.
Use [API v2 JSON](https://www.nlm.nih.gov/pubs/techbull/ma24/ma24_clinicaltrials_api.html)
for initial search and selected-study ingestion. Use [AACT snapshots/SQL](https://aact.ctti-clinicaltrials.org/landing)
for reproducible bulk work when warranted. Record the snapshot/retrieval date and
NCT ID; API and AACT versions of one study must not count twice. Do not depend on
an unverified headline count of studies with results.

## Evidence lifecycle and storage

1. **Authorize the source:** record approved purpose, access method, retention,
   attribution, redistribution, and automated-processing permissions. An available
   URL does not authorize unrestricted collection or sending content to an LLM.
2. **Ingest idempotently:** save source identity/version, canonical link, retrieval
   time, and permitted payload. Queue cursor-based refreshes with rate limits,
   backoff, checkpoints, and per-record errors; retries must not create new evidence.
3. **Normalize and review:** map entities/units, retain source locations, mark
   unsupported claims and uncertain matches, identify overlaps, and validate
   source-specific records. Quarantine ambiguity instead of inventing values.
4. **Compute:** run a versioned deterministic method against explicitly selected
   reviewed inputs; store exclusions, denominators, uncertainty, and limitations.
5. **Publish:** release approved views/exports with source links, method and input
   versions, lane labels, and review status. Unknown is visible, not converted to zero.
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
  public protocols, and analysis releases. A publication view is an allowlist, not a
  serialization of an internal row.

Logical names such as `source_records`, `evidence_reports`, `study_effects`,
`analysis_releases`, and `exchange_submissions` describe planned entities, not
existing SQL tables. Reconcile them with the app schema before writing canonical
migrations. Logs and queues use opaque IDs rather than health narratives.

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
model/prompt/parser version. It cannot fabricate doses, effect sizes, sample sizes,
or clinical certainty. Extraction confidence measures extraction reliability, not
truth or treatment efficacy. Treat source text as untrusted data, never executable
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
trials. Default pages show the evidence lanes and user-selectable comparisons.
Every calculated number has its eligible input set, exclusions, denominator,
method version, date, and a path back to permitted original sources. Suppress a
score when its denominator or required fields are missing. Confidence intervals
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
| `StudyProtocol` / `study-protocol.schema.json` | `packages/trials` | Stable study ID, immutable protocol version, design, eligibility, outcomes/schedule, analysis plan, operator/contact, review status; public approved projection excludes participants and signed consent |
| `PersonalDataExport` / `personal-data-export.schema.json` | `packages/importers` | Manifest, codebook/schema versions, measurements, ratings, provenance, units/time zones and permitted attachments; authorized encrypted download/transfer, never an aggregator upload |
| `ClinicSummary` / `clinic-summary.schema.json` | `packages/summary-file` | Node/release/cohort IDs, period, design, outcome/comparator, permitted counts/statistics or effect+uncertainty, overlap declaration, privacy policy/version and release approval; no person IDs, narratives or raw rows |
| `AnalysisRelease` / `analysis-release.schema.json` | `packages/evidence` | Input IDs/revisions, inclusion/exclusion decisions, codebook/method/code versions, parameters, results/uncertainty, lane, limitations, review and supersession status; public only after publication gate |
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
- Canonical treatment/condition/outcome/unit IDs include a codebook version;
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
  promised here. Authenticated node submissions require scoped credentials, key
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
aggregators, and exact moments/effect estimates can still disclose information.
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
- Source replay tests: API/AACT duplicates, papers describing the same cohort,
  comment reposts/follow-ups, missing denominators/results, failed fetches, and deleted sources.
- Known-answer statistics: arm matching, uncertainty, outcome direction, shared controls,
  sparse events, incompatible-study rejection, and score denominators; independent methods review.
- End-to-end provenance: every displayed number resolves to reviewed source/input versions;
  published pages contain no demo/AI-invented evidence or unauthorized private fields.
- Consent/access tests: cross-patient and cross-clinic denial, researcher access limits,
  protocol-version enrollment, withdrawal, export authorization, and no auto-enrollment.
- Lifecycle tests: retries, failed review, changed sources, deletion through caches/indexes,
  revoked node credentials, signed submission replay, and downstream withdrawal acknowledgment.
- Clinic privacy tests: small/complementary cells, repeated and overlapping releases,
  multiple aggregators, and attempts to reconstruct suppressed data. Keep federation off
  until review demonstrates the selected release policy satisfies the threat model.
