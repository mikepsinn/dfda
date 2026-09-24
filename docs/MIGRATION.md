# Migration plan

**Status:** draft, September 2026. Nothing below has moved yet.

dFDA code and data are spread across four repositories. The plan: [`apps/dfda-node`](../apps/dfda-node) in this repo is the base. It takes over dfda.earth, and the dfda features in optimitron's `apps/dfda` move into it. This document lists where things are, what moves, what happens to each dataset, and the order of the work. Each step can ship on its own.

## Where things are today

| Repository | What it has | Runs at |
| --- | --- | --- |
| `mikepsinn/dfda` (this repo) | [`apps/dfda-node`](../apps/dfda-node): Next.js and Supabase app for patients, providers and research partners. [`apps/crowdsourcing-cures`](../apps/crowdsourcing-cures): an older copy of the crowdsourcingcures.org site that has diverged from the standalone repo. [`apps/fdai`](../apps/fdai): experimental. `packages/database` and `packages/db-ops`: tools for the legacy MySQL schema. | prototype.dfda.earth |
| `mikepsinn/crowdsourcing-cures` (private) | Organization homepage, patient-rating Treatment Rankings, trial search, articles | crowdsourcingcures.org |
| [`mikepsinn/optimitron`](https://github.com/mikepsinn/optimitron) | `apps/dfda`: condition and treatment pages (the numbers are AI estimates), trial search, and an MCP server and REST API for personal tracking. It shares optimitron.com's database and sign-in. `packages/optimizer`: N-of-1 analysis. `packages/tracking`: measurements and reminders. `packages/data`: wearable importers, a ClinicalTrials.gov client, a condition list. | dfda.earth |
| `mikepsinn/curedao-api` (private) | The legacy PHP and AngularJS app: user accounts, OAuth, wearable connectors, reminders, the MySQL database, and the generator for the static studies site | app.dfda.earth, studies.crowdsourcingcures.org |

## The base: apps/dfda-node

It already has:

- Sign-in through Supabase Auth, and its own OAuth server (authorization and token endpoints with PKCE, and client registration for developers)
- Patient screens: conditions, treatments, 0–10 treatment ratings, side effects, measurements and reminders
- Provider and research-partner screens
- Public condition, treatment, outcome-label and trial pages, and an OpenAPI route
- The white and purple theme that dfda.earth will use

One codebase covers the parts of the design:

| Part | In `apps/dfda-node` |
| --- | --- |
| Digital Twin Safe | The patient side, hosted at dfda.earth |
| Clinic Node | The provider side. A clinic runs its own copy; the app was started as a white-label node. |
| Global Aggregator | New. Can be a separate app later. |

Before it serves dfda.earth, its outcome labels need the same rules as everything else: they currently show demo seed data (including a placeholder citation) and AI-generated numbers.

## What comes from optimitron

Everything dfda-specific leaves optimitron, including dfda.earth's MCP server and tracking REST API. optimitron.com keeps its own MCP server. Moved features are restyled from optimitron's neobrutalist style to dfda-node's theme.

| Feature in optimitron `apps/dfda` | In `apps/dfda-node` | Notes |
| --- | --- | --- |
| MCP server: 11 tools for measurements, reminders and notifications | A new `/api/mcp` route that calls dfda-node's existing measurement and reminder actions | Signs in through dfda-node's own OAuth server. MCP clients also need dynamic client registration and the standard `.well-known` metadata, which that server doesn't have yet. |
| REST API (`/api/v1`: measurements, reminders, notifications, variables) and its generated OpenAPI document | Next to the existing OpenAPI route | Same auth as the MCP server |
| Trial search | The existing `find-trials` page | optimitron's ClinicalTrials.gov client is documented and tested; it replaces dfda-node's unused helper |
| Landing, about and FAQ content | Existing public pages | Copy only |
| Condition and treatment pages | Not moved | They show AI estimates. dfda-node's own pages show patient ratings instead. |
| 6 unit tests | With the features they cover | |

**What stays in optimitron**

- `packages/tracking`, `packages/db` and `packages/data`, which optimitron.com and the other sites use. dfda doesn't depend on them; they aren't published.
- The AI-estimated medical data in `packages/data`, which optimitron's database seed also uses. dfda takes only the condition list and its ICD-10 codes (see Data).
- The `DFDA_*` constants in the `packages/data` parameters. They are economic-model inputs used by several optimitron sites, not app code.
- The site-kit "how it works" sections that other optimitron sites render. Their links keep pointing at dfda.earth.

**What has to be untangled**

1. **Accounts.** dfda.earth's current accounts are optimitron accounts, and its MCP server only accepts tokens that optimitron.com issues. After the move, people sign in with dfda-node accounts, and MCP connectors reconnect once.
2. **Data.** dfda.earth reads and writes the same database as optimitron.com: users, measurements, reminders, notifications and variables. People who tracked through dfda.earth need a way to bring their data along (see Open decisions).
3. **Email.** Every optimitron site sends email from `no-reply@updates.dfda.earth`. optimitron needs its own sending address before dfda.earth leaves.
4. **Cleanup in optimitron** after the move: `apps/dfda` itself, the dfda site variants in site-kit and `apps/optimitron`, dfda.earth in optimitron.com's list of MCP hosts, the CI build entry, the `pnpm copy` and visual-test scripts, the Vercel project scripts, and the docs that mention `apps/dfda`. optimitron.com's redirects of `/conditions`, `/treatments` and `/find-trials` to dfda.earth can stay.

**Cutover.** dfda.earth switches to dfda-node once its MCP server and REST API work. If the pages are ready first, dfda-node can forward `/api/mcp`, `/api/v1/*`, `/.well-known/oauth-protected-resource/mcp` and `/openapi.json` to the old optimitron deployment on a Vercel address until then.

## Shared packages

| Package | Contents | Built from |
| --- | --- | --- |
| `analysis` | N-of-1 and population statistics | optimitron `packages/optimizer`, with two known bugs fixed first: p-values are wrong for small samples (df ≤ 30), and rankings use effect size without direction, so harms score the same as benefits |
| `codebook` | Shared names and IDs for conditions, treatments, outcomes and units | The curedao-api variables table, the `apps/dfda-node` seeds, and optimitron's condition list with ICD-10 codes |
| `summary-file` | The Summary File format and its validators, shared by Clinic Nodes and the aggregator | New |
| `importers` | Parsers for wearable and app exports | optimitron `packages/data/src/importers`, which were ported from curedao-api's PHP connectors |

The existing `packages/database` and `packages/db-ops` are the tools for moving the legacy data. They are retired once the move is done.

## Data

| Data | Where it is | Plan |
| --- | --- | --- |
| Patient ratings: 162 conditions and ~3,900 treatments, reported by patients | curedao-api `ct_*` tables, copied into crowdsourcing-cures | Migrate. They become the first Data Release, labeled patient-reported and kept separate from clinic data. |
| Legacy measurements: about 13 million, with per-user and population analyses | curedao-api MySQL | Move a person's data into their Safe only if they choose to (see Open decisions). |
| Tracking data recorded through dfda.earth | optimitron's database | Same as legacy measurements |
| ~15,800 automated N-of-1 studies | Static site generated by curedao-api | Keep as an archive. Don't republish them as evidence. |
| AI-estimated medical data (216 conditions, 969 treatments) | optimitron `packages/data` | Don't migrate the numbers. The condition list and its ICD-10 codes seed the `codebook`. |
| `apps/dfda-node` demo data | Supabase seeds | Clear it before dfda.earth points at the app |

## Order

1. **Foundation.** Build `analysis` (with the fixes above) and `codebook`. Take the demo data and AI-generated numbers out of dfda-node's outcome labels.
2. **dfda.earth.** dfda-node gains the patient-rating Treatment Rankings and, from optimitron, trial search, the MCP server and the REST API. dfda.earth then moves to it, and optimitron deletes `apps/dfda`. crowdsourcingcures.org drops its own health-data pages and links to dfda.earth, and `apps/crowdsourcing-cures` is removed from this repo.
3. **Network.** Package dfda-node so a clinic can run its own copy as a Clinic Node, then build `summary-file` and the aggregator.
4. **Legacy.** Bring over legacy data for the people who choose to, then retire the legacy app at app.dfda.earth.

## Rules for published numbers

These apply from step 2 on:

- Clinic Nodes send aggregates only. Every count in a Summary File is 0 or at least 11; counts from 1 to 10 are suppressed.
- Every outcome declares which direction is better.
- Proportions are reported with Wilson intervals.
- A treatment is ranked only when it has at least 30 patients from at least 3 sources.
- No AI-generated numbers.

## Not in any repo yet

None of the existing code does the parts that make this a network. These are new work:

- Anonymization at the Clinic Node, before anything leaves it
- Consent records
- Node identity and authenticated Summary File submission
- Pooling across sites (random-effects meta-analysis with heterogeneity estimates)
- A treatment-effect estimator for clinical records (before and after starting a treatment, or treated against a comparison group). The existing engines only compute within-person correlations.
- A Clinic Node that a clinic can install and run itself

## Open decisions

1. **Existing tracking data.** How to ask people with data in the legacy app or in dfda.earth's tracking whether to move it into a Safe, and what happens to data from people who don't answer.
