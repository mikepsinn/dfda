# Posted trial comparisons

The first source-backed slice is a **single reported comparison**, not a
meta-analysis or a replacement for the provisional treatment rankings.
It appears on `/outcome-labels/demo/insomnia/suvorexant`, with a link from the
insomnia rankings. No database, private credentials or model call is needed.

## Source and extraction

`NCT01097616.suvorexant-sleep.v1.json` contains selected objects from the
[ClinicalTrials.gov API v2 study record](https://clinicaltrials.gov/api/v2/studies/NCT01097616),
including the complete selected outcome, group definitions, design, source update
date, retrieval timestamp and SHA-256 of `JSON.stringify(source)`. It contains
public aggregate results, not participant records. Attribution remains attached
in the snapshot and through the public [posted-results link](https://clinicaltrials.gov/study/NCT01097616?tab=results).

The endpoint was chosen to exercise the pipeline because it has an explicit
reported contrast and interval, not because a systematic search established this
as the best or representative study. Extraction was checked against this record;
clinical interpretation, risk-of-bias assessment and evidence coverage remain
unreviewed. `origin: trial-reported` describes the source, not certainty of benefit.

The narrow adapter at `lib/evidence/clinical-trial-comparison.ts` selects:

- `resultsSection.outcomeMeasuresModule.outcomeMeasures`, by the exact title
  `Suvorexant LD Versus Placebo: Change From Baseline in sTSTm at Month 3`.
- `groups`, joined by ID: `OG000` = Suvorexant LD; `OG001` = Placebo. Trial doses
  were 20 mg at ages 18–64 and 15 mg at ages 65+, nightly, after a placebo run-in.
- `denoms[units=Participants].counts`, joined by group ID: 228 and 339 analyzed
  for this endpoint. These are not the study's total enrollment of 1,023.
- The sole class/category's `measurements`, joined by group ID: adjusted changes
  from baseline of 51.2 and 40.6 minutes in diary-reported sleep time, days 76–90.
- The two-group `analyses` entry: reported difference in least-squares means
  **10.7 minutes**, two-sided **95% CI 1.9–19.5**. The direction was checked as
  treatment minus placebo. It is not inferred from array order. Subtracting the
  rounded group values would give 10.6, so we retain the posted comparison.

The source's secondary-endpoint classification, analysis population, covariate
adjustments and multiplicity-testing notes are retained. Do not calculate a
standard error from the separate adjusted arm intervals, infer zero missing data,
or equate this endpoint with a 0–100 effectiveness score or remission percentage.
The source's adverse-event tables and other endpoints have not been imported.

## Reproduce and refresh

From `apps/web`:

```powershell
pnpm exec tsx scripts/import-clinical-trial-comparison.ts --check
pnpm exec tsx scripts/import-clinical-trial-comparison.ts
pnpm exec tsx scripts/import-clinical-trial-comparison.ts --write
pnpm test:unit
pnpm type-check
```

`--check` validates the saved data and checksum offline. No flag fetches and
previews without writing. `--write` explicitly replaces this local snapshot;
review the diff and corresponding display text before committing or publishing.
The checksum covers the selected source object, not the entire API response.
It proves local consistency, not clinical validity. Refreshes do not auto-publish.

The adapter rejects unsupported endpoint types/units/time points/designs,
ambiguous categories or analyses, missing/duplicate groups, invalid denominators,
missing/non-numeric effects, reversed intervals and incompatible effect direction.
Tests permute array order and use the pinned source as a known-answer fixture.
This is deliberately not a general-purpose ClinicalTrials.gov parser. Hard-coded
endpoint/regimen explanations must be rechecked if the source selection changes.

## Next: compatible synthesis

Define the question and search/screening log, review another eligible study's
endpoint and analysis population, link publications/registry versions, and check
cohort overlap/shared controls before pooling. Then add reviewed effect/variance
handling, meta-analysis known-answer tests and an included/excluded study table.
Only source-backed compatible effects enter that calculation; the Optimitron
estimates remain separate. See the [roadmap](../../../../docs/MIGRATION.md#clinicaltrialsgov-results).
Do not generalize this one endpoint into overall efficacy or safety claims.
