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

**Demo, 2026-10-11 (`apps/web/lib/instance`):** a signed-in company creates an
instance at `/instances/new` (name, address, tagline, theme, logo, products and
an optional domain). The whole site then shows its branding on a preview link
(`/i/{slug}`), on `{slug}.<INSTANCE_ROOT_DOMAIN>` when a wildcard domain is set
up, and on the company's own domain once its DNS points to the deployment; with
`VERCEL_API_TOKEN` and `VERCEL_PROJECT_ID`, saving the domain also adds it to the
Vercel project. Without them the owner adds the domain in Vercel by hand. Whether
the domain is connected needs no key. First a DNS lookup: a CNAME to Vercel, or
Vercel's A addresses. Then one HTTPS request to the address that the lookup found
(public addresses only, with a valid certificate for the domain) must get this
company's slug from `/api/instance`, because DNS can point to Vercel before the domain
is on the project. A domain behind a proxy such as Cloudflare's hides its records,
so it counts as not connected, and care team invitations then use the preview link. People can sign in on the instance's domain. This is branding
only: all instances share one database, one set of accounts and one evidence
pipeline. It does not verify domain ownership and does not isolate tenants; the
isolation, data-ownership and compliance work below comes before real customer
data.

**Instance themes, 2026-10-21:** the owner sets a brand color, a background
color, a font (Inter, the system font or a serif) and a corner size. The other
page colors follow from the background, readable on it; a dark background gives
a dark site. Printed pages, such as a biomarker report, stay light. The form
refuses a middle-tone background, on which no text color is easy to read, and
it warns when the brand color is hard to read on the background. Clinics thus
get their own look without code or a fork, and nothing about a customer's brand
is in the repository.

**The company's own site, 2026-10-22:** a member sees one company, not a
network. On an instance the footer, sign-in page, password pages, page
metadata, link-preview image (`/share-image.png`) and tab icon show the company
and nothing of the network; the Google button is hidden there, because Google's
screen names the network's app. Sign-in and password emails come from the
company (its name as the sender and in the subject, its optional support email
as the reply address), and their links sign the person in on the host they
used: the sign-in library builds links on the main site, so
`lib/instance/auth-email.ts` moves the link and the pages it opens to that host.
Care team invitations link to the company's own domain or subdomain. The
sending address stays the network's until a company verifies a sending domain
of its own, and the privacy policy must still describe who processes members'
data.

**Byline and demo mode, 2026-10-24:** a company's name stays short (such as
"Acme"): it is the name in titles, emails and consent text. An optional
byline (such as "by Acme Health") shows only under the name on the home page and
after it in the footer
([`20261024020000_alter_instances_byline_and_demo.sql`](../apps/web/db/migrations/20261024020000_alter_instances_byline_and_demo.sql)).
The owner can also show a demo on the site: "Try it as a patient" and "Try it as
a clinician" on the home and sign-in pages sign the visitor in as the site's own
demo patient, with the example report in the first program with care team
review, or as a demo clinician of its care team, who opens that patient's case
([`lib/demo/instance.ts`](../apps/web/lib/demo/instance.ts)). Any visitor can use
these accounts, so they must never see a real person. The demo stays on beside
real members (decision 2026-10-24, the same day: a clinic shows its product on its
live site; the network's demo clinic stays for the network itself). The demo
sign-in records both accounts by user id in `instance_demo_accounts`, which users
cannot change (a user can change their profile's email), and
`care_team_can_see()` and `care_team_patients()` give the demo clinician the demo
patient only, and never give the demo patient to the real care team
([`20261024030000_table_instance_demo_accounts.sql`](../apps/web/db/migrations/20261024030000_table_instance_demo_accounts.sql)).
The company totals and the report emails also leave the demo people out, and no
email goes to a demo account. Turning the demo off removes the demo people from
the site. Each site has its own two demo accounts, not the network demo clinic's
accounts; their password comes from the server's secret, so only the demo
sign-in can use them.

**Clinic home page, 2026-10-24:** a company site with a program in which its
care team reviews the reports gets a home page for both of its audiences
([`components/instance/ClinicHome.tsx`](../apps/web/components/instance/ClinicHome.tsx)):
"For patients" (the programs) and "For clinicians" (sign-in, or the demo), then one
case in four steps (Baseline, Track, Follow-up, Decide), each with what the patient
does and what the clinician sees. The pictures are the case page's own parts,
filled with the site's demo patient
([`lib/instance/case-preview.ts`](../apps/web/lib/instance/case-preview.ts)), so
the page reads nobody's data. Other company sites keep the home page for people
who track a product.

**Menus by role, 2026-10-24 ([`lib/instance/menu.ts`](../apps/web/lib/instance/menu.ts)):**
the header of a company site links what the person does there. A visitor gets the
programs, how it works, the example report and, with the demo on, the demo; a member,
their program and their reminders; a clinician of the care team, the patients with the
number of reports that wait for review; the owner, the site's settings. A person with
several roles gets the links of each. On a phone the links are in one "Menu" list. The
footer and the home page also link the example report.

**Instance sites, 2026-10-11:** on an instance, the site is the company's own:
its header, footer and home page, its programs at `/programs`, sign-in, a
member's reminders, and the terms and privacy pages. The network's other pages
(rankings, trials, Outcome Labels, role dashboards and role selection) give 404
there. [`lib/instance/routes.ts`](../apps/web/lib/instance/routes.ts) lists the
paths, and `middleware.ts` applies the list. The instance pages stay in the one
route tree of `apps/web`: one release, no second app. The terms and privacy pages
are the network's unless the company writes its own (below).

**Content pages, 2026-10-22 (`apps/web/lib/instance/pages.ts`):** an instance
owner writes pages of text in Markdown at `/instances/{slug}/pages/new`: what the
company measures, how its service works, an FAQ. The company's site shows each
page at `/pages/{slug}`; a page in the menu is linked in the header on wide
screens, and every page is linked in the footer. A page with the address `terms`
or `privacy` takes the place of the network's page at `/terms` or `/privacy` on
the company's site. Decisions:

1. One generic page type, not a feature per kind of content (such as a marker
   list with its own upload format): a company that has a list or a table writes
   it as a Markdown table, and any company can use the same pages.
2. The text is Markdown only: raw HTML is not rendered, and links with an unsafe
   protocol lose their address, so a page cannot run scripts on the company's site.
3. Pages are public, like the branding (row-level security: anyone reads, only the
   instance's owner writes). Do not put anything on a page that the company does
   not want to publish.

**Programs, 2026-10-11 (`apps/web/lib/programs`):** an instance owner defines
programs at `/instances/{slug}/programs/new`, from a GLP-1 or BPC-157 template or
blank: doses and check-ins (reminder schedules when a person joins), labs entered
at the start and at a follow-up week, and which direction is better for each
measure. On the instance's site, a person joins at `/programs/{slug}` and gets a
before/after report at `/programs/{slug}/me`. Three decisions for this demo:

1. The company sees totals only: per measure, how many people have values at both
   times and how many improved, hidden below 5 people. Row-level security gives
   the owner no access to enrollments; the server reads the totals after it
   checks ownership, and only totals leave it.
2. A person's values count in a company's totals only while they are in its
   program. Joining says so; they can leave at any time.
3. Sample data (30 made-up people per program, and an example report) is generated
   in memory, never stored, and never used by Outcome Labels, rankings or other
   evidence. The company's dashboard shows it under its "Sample data" tab; the
   pages carry no warning box about it (decision 2026-10-24: demo data is plainly
   demo data).

A before/after change in one person or one program is not a treatment effect; the
pages say that a change after the start does not prove that the product caused it.

**The daily check-in, 2026-10-24 (`apps/web/lib/programs`):** a member records a day
at `/programs/{slug}/me` with one button for each number of a rating (0 to 10 for
most symptoms, with the words of the better direction at the two ends), and "Took
it" (the program's usual amount, or another amount) and "Skipped" (0) buttons for a
dose: a skipped dose is a value, so the care team can tell it from a day that nobody
recorded. Other values, such as weight, are number fields with a unit menu: units of
the same kind whose size is near the program's unit, so kilograms and pounds but not
milligrams (`units.ts`). The value is saved in the unit chosen; the member's own
report shows the unit they chose last, and the care team and the company see the
program's units. Under the day form,
the member adds side effects: symptoms from the variables catalog that are rated on
a scale (`side-effects.ts`, table `enrollment_side_effects`), with today's rating
and a daily reminder if they want them. The day form then asks for each side
effect, and in a program with care team review the care team sees them with the
other logs. Once a day, after the last of the day's reminders in the member's time
zone, the member gets one email for each program (`check-in.ts`): number buttons
for each rating, and "Took it" and "Skipped" for each dose. Four decisions:

1. A button in the email opens the check-in page with that answer chosen; the
   member saves there. Some email systems open each link of an email to check it,
   so opening a link must not record anything.
2. The link opens the check-in without a sign-in. It holds the enrollment and the
   day, signed with `BETTER_AUTH_SECRET`, and records values of that day only, for
   3 days. It shows no values, and the email holds none.
3. The emails do not need the worker: a scheduler calls
   `/api/cron/check-in-emails` every hour with `CRON_SECRET`
   (`.github/workflows/check-in-emails.yml`, or a Vercel cron job). Each email of a
   day is sent once (table `check_in_emails`).
4. No email when the member turned the reminders off, already recorded each item
   of the day, or is a demo account of a site.

Biomarker reports (`lib/biomarker-report`, `components/biomarker-report`, the example
at `/reports/example`) show one person's blood markers at several timepoints, read
against that person's own noise, next to the clinic's laboratory values. They have the
sections of a printed clinician report. On screen a report is a page of the site in the
site's light or dark colors; it prints as one A4 page per sheet on light paper, like the
clinician PDF (decision 2026-10-22: on a dark company site, a light paper sheet looked
like a PDF viewer). A report file
may leave out the panel summaries and the summary-page card texts: the upload writes
them from the file's numbers in fixed sentences (`lib/biomarker-report/text.ts`),
facts only, with no advice. They are written once, so a report does not change after
sign-off. Advice and the other texts (the visit, the methods) come from the file. Each
program template has its own example report, chosen by the program's dose and shown at
`/programs/{slug}/example`: semaglutide for the GLP-1 template (12 weeks), and BPC-157 for
the BPC-157 template (8 weeks, a tendon recovery, with its expected directions given as
the program's aims, because human studies of BPC-157 are few;
[`example-bpc-157.ts`](../apps/web/lib/biomarker-report/example-bpc-157.ts)). A site's demo
patient gets the report of their program. A program of another drug shows the short
before-and-after table. The data
file holds only values and text; the rules calculate every status, index and count.
The example report uses made-up values. By the owner's decision, it carries no
"Sample data" label on the page, so that a company can show its product as it will
look. Like program sample data, it is never stored as evidence or read by Outcome
Labels, rankings or company totals. A care team adds a person's own report files (below).

**Care teams, 2026-10-21 (`apps/web/lib/care-team`):** the company still sees totals
only. A person can also share the biomarker reports of a program with the instance's
care team: the clinicians that the owner invites by email at `/instances/{slug}`. The
invited person opens the emailed link at `/care-teams/join/{id}` and joins after they
sign in with that email; the owner sees the same result whether or not an account uses
the email
([`20261021070000_table_care_team_invitations.sql`](../apps/web/db/migrations/20261021070000_table_care_team_invitations.sql)).
The person
chooses when they join and can change it on their program page; when they stop, the
care team loses the access at once. A program with **care team review**, such as a
clinic's treatment program, has no such choice: the join page says that the care team
adds and reviews the person's reports, joining shares them, and the person stops by
leaving the program (decision 2026-10-23: in a clinic, the care team treats the person
and orders the tests, so a separate share step only added a step;
[`20261023020000_alter_instance_programs_care_team_review.sql`](../apps/web/db/migrations/20261023020000_alter_instance_programs_care_team_review.sql)).
Care team review is on for a new program; the owner turns it off in the program form
(decision 2026-10-24: most programs are a clinic's treatment programs). Programs that
nobody had joined took the new default; a program with members keeps its setting
([`20261024010000_alter_instance_programs_care_team_review_default.sql`](../apps/web/db/migrations/20261024010000_alter_instance_programs_care_team_review_default.sql)).
The care team, at `/instances/{slug}/care`, sees
the people who share and their reports, adds a report file (checked against the report
format), and signs a report off with a decision for the care plan (continue, adjust,
investigate, or not enough information to decide) and an optional note for the person.
Its list of patients is a queue: first the people with reports to review, the longest
waiting first; then the people without a report; then the others
([`lib/care-team/queue.ts`](../apps/web/lib/care-team/queue.ts)). A person's page
in the care area is a case in four chapters
([`lib/care-team/case.ts`](../apps/web/lib/care-team/case.ts)): **Baseline** (the
program, the dates and a dot for each sample on the way to the follow-up), **Track**
(what the person logged, on the weeks of the samples: the dose as steps, check-ins and
lab values as points that are never joined into a curve, and the report's reported
effects), **Follow-up** (the latest report by pathway, the largest change of each panel
as a card, and one marker at a time: its values, the band of the person's own noise, the
dose, and the studies about its change on the program's drug, each with its population,
finding and limits) and **Decide** (the report assistant, then a note that starts as a
draft of facts from the report's statuses, which the clinician edits before the
sign-off). The studies are a short, checked list
([`lib/care-team/evidence.ts`](../apps/web/lib/care-team/evidence.ts)); a marker without
an entry says that no reference is verified yet, instead of an expected change. In a
program with care team review the care team also sees what the person logs in the
program (decision 2026-10-24: the clinic treats the person, and the dose and the effects
explain the report); the join page says so, and the server reads those logs only after
it has checked the care team with the clinician's own permissions
([`careLogs`](../apps/web/lib/care-team/data.ts)). In other programs the care team sees
the reports only. The person sees each
report as soon as it is saved, with its review status and the note. The pages show the
decision to the care team only (decision 2026-10-23: the decision is the care team's
working record, and the note is what the clinician tells the person); the database
still lets a person read all of their own report rows. Emails from the company tell the
person that a report is added and that it is reviewed, and tell the other clinicians that
a report waits for review
([`lib/care-team/notify.ts`](../apps/web/lib/care-team/notify.ts)); they hold only a link,
no values, decisions or notes. A laboratory, or another system of the company, can send
reports itself: the owner creates an import key on the instance page (the database keeps
only its hash), and the laboratory sends each report to `POST /api/v1/biomarker-reports`
with the program, the person's email and its own id of the report, so that a report sent
again is saved once
([`lib/care-team/import.ts`](../apps/web/lib/care-team/import.ts),
[`20261023030000_table_instance_import_keys.sql`](../apps/web/db/migrations/20261023030000_table_instance_import_keys.sql)).
An import reaches only a person who shares their reports with the care team. The care
team can also ask the **report assistant** about a report, as in a clinical evidence search:
Claude reads the report as a cited document and searches the medical literature on a fixed
list of trusted sites (indexes, agencies and journals), and every part of the answer has a
numbered source, a quote of the report or a page of the literature
([`lib/care-team/assistant.ts`](../apps/web/lib/care-team/assistant.ts),
[`lib/care-team/ask.ts`](../apps/web/lib/care-team/ask.ts)). It answers; the clinician
decides. The report goes to the model without the person's name. The questions and answers
are the care team's record, which the person does not see, and a company can ask 50
questions a day
([`20261023040000_table_report_questions.sql`](../apps/web/db/migrations/20261023040000_table_report_questions.sql)).
Decision 2026-10-23: health data goes to the Claude API only under a business associate
agreement, so until there is one the assistant works only on the demo clinic, whose values
are made up. Row-level security enforces each of
these rules
([`20261021050000_table_care_teams_and_biomarker_reports.sql`](../apps/web/db/migrations/20261021050000_table_care_teams_and_biomarker_reports.sql),
[`20261023010000_alter_biomarker_reports_review_decision.sql`](../apps/web/db/migrations/20261023010000_alter_biomarker_reports_review_decision.sql)).
The owner is not on the care team unless they enter their own email, and no evidence, ranking
or total reads the reports. The demo clinic's journeys (patient, clinician and owner)
are written in [`content/clinic-demo/script.md`](../apps/web/content/clinic-demo/script.md);
a browser tour follows them and can record them as videos.

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
| `apps/web/data/optimitron` and `apps/web/data/evidence` | Medical dataset forked from Optimitron (corrected here, with a sourced log) and a separate posted-trial snapshot are present. Explicit origins; only non-sensitive content cleared for redistribution before publication, not private patient records or restricted source payloads |
| `apps/web/lib/studies` | Study wizard, eligibility, consent/enrollment state machine, protocol review and publication; reuse existing trial/enrollment actions and tables where appropriate |
| `apps/web/lib/instance` | Validated branding/module configuration and operator administration |
| `apps/web/lib/data-export` | Authorized personal export/import orchestration and transfer audit |
| `apps/web/worker` and `apps/web/cron-enqueuer.ts` | Durable ingestion, refresh, validation, analysis, publication, deletion propagation, and reminders; supporting processes, not separate products |
| `apps/web/db/migrations` | Canonical SQL schema, access policies, and publication views; no new canonical database package |
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
uses a full-access database client (`adminDb`, which replaced the Supabase
service-role client); this is **not** the target trust boundary
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
