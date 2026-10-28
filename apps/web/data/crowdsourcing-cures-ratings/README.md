# Crowdsourcing Cures Aggregated Self-Reported Patient Ratings

A snapshot of the patient-rating tables behind crowdsourcingcures.org's condition
and treatment pages. Every row is an aggregate (vote counts or a percentage for a
condition–treatment, treatment–side effect, condition–symptom or condition–cause
pair). There are no individual reports or personal records.

| File | Rows | Contents |
| --- | --- | --- |
| `treatment-ratings.jsonl` | 5,878 | How patients rated each treatment for a condition (162 conditions, 3,908 treatments) |
| `treatment-side-effects.jsonl` | 2,505 | Side effects reported for each treatment |
| `condition-symptoms.jsonl` | 4,186 | Symptoms reported for each condition, with severity |
| `condition-causes.jsonl` | 3,653 | Causes patients attributed their condition to |

`manifest.json` records the source, retrieval time, row counts, sizes and SHA-256
of each file.

## Fields

IDs (`conditionId`, `treatmentId`, `sideEffectId`, `symptomId`, `causeId`) are the
Crowdsourcing Cures database IDs. Names are kept exactly as in the source.

- **Treatment ratings:** `majorImprovement`, `moderateImprovement`, `noEffect`,
  `worse` and `muchWorse` are the number of ratings in each category. `popularity`
  is their total. `averageEffect` (0–254) is copied as-is: its meaning isn't
  documented and it doesn't follow from the counts (Exercise for Depression has
  mostly improvement votes and an `averageEffect` of 1), so don't display or rank by it.
- **Side effects and causes:** `votesPercent` (0–100) is a percentage whose
  denominator isn't recorded.
- **Symptoms:** `votes`, plus counts by severity from `extreme` to `noSymptoms`.
  In 3,721 of 4,186 rows the severity counts add up to less than `votes`.

Columns that were empty in every row (`description`, `content`, `featuredImage`,
`deletedAt`), import timestamps, and the derived `numberOf…` counts are left out.

## Source and what isn't known

Exported from the Crowdsourcing Cures Postgres database (Neon project `wishonia`,
`Dfda*` tables). Those tables were filled on 2024-09-04 from curedao-api's `ct_*`
MySQL tables ([migration plan](../../../../docs/MIGRATION.md#data)) and haven't
changed since; the site's own tables for new reports are empty.

Not recorded anywhere in the source:

- when and how the ratings were collected;
- whether one person could rate a treatment more than once, so counts are ratings,
  not unique patients;
- the denominators behind `votesPercent`.

Permission to republish the data was confirmed on 2026-10-13.

The data has known clean-up needs, left untouched here: 211 treatment pairs have
no votes, and 43 groups of treatment names differ only in case, spacing or
punctuation (for example `Omega 3 fatty acids ` and `Omega-3 fatty acids`).

These are patient-reported counts on their original five-point scale. Show them
as counts with their total. A share such as "reported improvement" is a share of
ratings, not the chance a treatment works. Don't turn the counts into an effect
size, or pool them with model estimates or trial results
([rules for published numbers](../../../../docs/MIGRATION.md#rules-for-published-numbers)).

## Where it's shown

`lib/evidence/patient-ratings.ts` reads `treatment-ratings.jsonl` for
`/treatment-rankings`. A source condition appears on a catalog condition's page
when its name matches that condition's name or one of its synonyms: 44 source
conditions on 42 pages. Each is shown under its own name (for example "Rated for
Heartburn" on the GERD page), and differently named conditions are never merged.
Treatments are ordered by the lower bound of the 95% Wilson interval for the share
of ratings reporting major or moderate improvement; pairs with no votes are left
out. The other 118 source conditions, such as Lower Back Pain, have no page yet.

## Reproduce

From `apps/web`:

```powershell
pnpm exec tsx scripts/snapshot-crowdsourcing-cures-ratings.ts --check
pnpm exec tsx scripts/snapshot-crowdsourcing-cures-ratings.ts
pnpm exec tsx scripts/snapshot-crowdsourcing-cures-ratings.ts --write
```

`--check` verifies the files against `manifest.json` offline. The other two read
the source database from `CROWDSOURCING_CURES_DATABASE_URL`: no flag previews row
counts, and `--write` replaces the snapshot.
