# Migration plan

**Status:** draft, September 2026. Nothing below has moved yet.

dFDA code and data are spread across four repositories. The plan: [`apps/web`](../apps/web) in this repo (formerly `apps/dfda-node`) is the base. It takes over dfda.earth, and the dfda features in optimitron's `apps/dfda` move into it. This document lists where things are, what moves, what happens to each dataset, and the order of the work. Each step can ship on its own.

## Where things are today

| Repository | What it has | Runs at |
| --- | --- | --- |
| `decentralized-fda/decentralized-fda` (this repo) | [`apps/web`](../apps/web): Next.js and Supabase app for patients, providers and research partners. [`packages/legacy-import`](../packages/legacy-import): tools for moving data out of the legacy MySQL database. | prototype.dfda.earth |
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
| Digital Twin Safe | The patient side, hosted at dfda.earth |
| Clinic Node | The provider side. A clinic runs its own copy; the app was started as a white-label node. |
| Global Aggregator | New. Can be a separate app later. |

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

crowdsourcingcures.org keeps the organization pages (home, initiatives, docs) and drops its health-data pages in step 3. Before that, two of its features move into the base app.

| Feature in crowdsourcing-cures | In the base app | Notes |
| --- | --- | --- |
| Patient-rating Treatment Rankings: the treatments ranked for each condition, and each treatment's ratings across conditions | The existing condition and treatment pages, which have a ranking component but show demo data | The ratings data moves too (see Data). Rankings follow the rules for published numbers below. |
| Logging measurements by typing: a person writes something like "took 200 mg magnesium, slept badly" and an AI turns it into measurements | Next to the existing photo-to-measurements action | The AI only reads the person's own words and produces no evidence numbers. It saves to the old app today, so it is rewired to the base app's own tables. |
| Trial search | Not moved | It has its own tested ClinicalTrials.gov client; `packages/trials` uses optimitron's instead. |

**Not moved**

- Pages that only show data from the old app at app.dfda.earth: measurement history, variable charts, predictor search, population studies, the reminder inbox, data-import connectors, the Digital Twin Safe link and the reaction-time test. The base app already has its own measurements and reminders, and predictor search and the variable charts get rebuilt on `analysis` later. These pages stop working when the old app is retired in step 5, so crowdsourcingcures.org removes them in step 3.
- AI-written pages: the per-condition meta-analyses, the cost-benefit analyses and the research articles. They break the no-AI-numbers rule. Whether crowdsourcingcures.org keeps them, labeled, is a separate decision.
- The drug-registration form and the muscle-mass cost-benefit page.

## ClinicalTrials.gov results

About 80,000 studies on ClinicalTrials.gov have posted results, 75,000 of them interventional (September 2026). A posted result gives each study group's size and its value on each outcome measure, and often the trial's own statistical comparison (effect estimate, confidence interval, p-value). Adverse events are posted per group as participants affected out of participants at risk. That is real outcome data for Outcome Labels that doesn't depend on recruiting clinics, so it is the first new data source.

How to use it:

- Read results in bulk from [AACT](https://aact.ctti-clinicaltrials.org/), the public database copy of ClinicalTrials.gov, instead of one API call per study.
- Start with side effects. Adverse events are the most uniform part of posted results, so rates against placebo are straightforward.
- Compare study groups, not rows. An effect is the treatment group against the comparison group on the same outcome measure and time frame. Use the trial's own posted comparison where there is one. Single-group studies give no comparison and are shown as such.
- Map each outcome measure to a `codebook` outcome, with its unit and which direction is better, before pooling across trials. This is the hard part: every trial names and measures its outcomes its own way.
- Pool across trials with the same random-effects code the aggregator needs, so this work also builds the aggregator's core.
- Label every number as trial-reported and link each trial by its NCT ID.

The old parser in optimitron (`apps/dfda/lib/fetch-trial-results.ts`) is not reused. It treats the first two numbers in a results table as before and after, which usually compares two different rows. Only 84 of the 5,776 outcome values in optimitron's medical data came from it.

## Shared packages

| Package | Contents | Built from |
| --- | --- | --- |
| `trials` | ClinicalTrials.gov search and the results parser | Search: optimitron's `packages/data` fetcher, which is documented and tested. The results parser is new. |
| `analysis` | N-of-1 and population statistics | optimitron `packages/optimizer`, with two known bugs fixed first: p-values are wrong for small samples (df ≤ 30), and rankings use effect size without direction, so harms score the same as benefits |
| `codebook` | Shared names and IDs for conditions, treatments, outcomes and units | The curedao-api variables table, the `apps/web` seeds, and optimitron's condition list with ICD-10 codes |
| `summary-file` | The Summary File format and its validators, shared by Clinic Nodes and the aggregator | New |
| `importers` | Parsers for wearable and app exports | optimitron `packages/data/src/importers`, which were ported from curedao-api's PHP connectors |

`packages/legacy-import` holds the tools for moving the legacy data. It is retired once the move is done.

## Data

| Data | Where it is | Plan |
| --- | --- | --- |
| Patient ratings: 162 conditions and ~3,900 treatments, reported by patients | curedao-api `ct_*` tables, copied into crowdsourcing-cures | Migrate. They become the first Data Release, labeled patient-reported and kept separate from clinic data. |
| ClinicalTrials.gov posted results: about 80,000 studies | Public (AACT or the API) | New source for Outcome Labels, labeled trial-reported (see above) |
| Legacy measurements: about 13 million, with per-user and population analyses | curedao-api MySQL | Move a person's data into their Safe only if they choose to (see Open decisions). |
| Tracking data recorded through dfda.earth | optimitron's database | Same as legacy measurements |
| ~15,800 automated N-of-1 studies | Static site generated by curedao-api | Keep as an archive. Don't republish them as evidence. |
| AI-estimated medical data (216 conditions, 969 treatments) | optimitron `packages/data` | Don't migrate the numbers. The condition list and its ICD-10 codes seed the `codebook`. |
| `apps/web` demo data | Supabase seeds | Clear it before dfda.earth points at the app |

## Order

1. **Foundation.** Build `analysis` (with the fixes above) and `codebook`. Take the demo data and AI-generated numbers out of the web app's outcome labels.
2. **Trial results.** Move the patient-rating Treatment Rankings from crowdsourcing-cures into the web app. Build `trials` and put trial-reported Outcome Labels next to them, side effects first.
3. **dfda.earth.** The web app gains trial search, the MCP server and the REST API from optimitron, and text measurement logging from crowdsourcing-cures. dfda.earth then moves to it, and optimitron deletes `apps/dfda`. crowdsourcingcures.org drops its own health-data pages and links to dfda.earth.
4. **Network.** Package the web app so a clinic can run its own copy as a Clinic Node, then build `summary-file` and the aggregator, reusing the pooling code from step 2.
5. **Legacy.** Bring over legacy data for the people who choose to, then retire the legacy app at app.dfda.earth.

## Rules for published numbers

These apply from step 2 on:

- Clinic Nodes send aggregates only. Every count in a Summary File is 0 or at least 11; counts from 1 to 10 are suppressed.
- Suppression alone doesn't survive repeated releases: if a group grows from 11 to 12 patients, subtracting one Summary File from the next reveals the new patient. Before any clinic data is shared, Summary Files also get a defense against this, such as fixed release periods with randomly rounded counts, or added noise (differential privacy).
- Every outcome declares which direction is better.
- Proportions are reported with Wilson intervals.
- A treatment is ranked only when it has at least 30 patients from at least 3 sources.
- Every number says where it came from: trial-reported, patient-reported or clinic data. Different kinds are shown side by side, not pooled together.
- No AI-generated numbers.

## Not in any repo yet

None of the existing code does the parts that make this a network. These are new work:

- A parser that turns posted trial results into comparisons between study groups
- Anonymization at the Clinic Node before anything leaves it, including protection against subtracting one release from another
- Consent records
- Node identity and authenticated Summary File submission
- Pooling across sites (random-effects meta-analysis with heterogeneity estimates)
- A treatment-effect estimator for clinical records (before and after starting a treatment, or treated against a comparison group). The existing engines only compute within-person correlations.
- A Clinic Node that a clinic can install and run itself

## Open decisions

1. **Existing tracking data.** How to ask people with data in the legacy app or in dfda.earth's tracking whether to move it into a Safe, and what happens to data from people who don't answer.
