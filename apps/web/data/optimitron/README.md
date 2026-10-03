# Medical dataset (forked from Optimitron)

This repository now owns and edits this dataset. `medical-data/` started as a
byte-for-byte copy of the **entire** upstream directory
`packages/data/src/datasets/medical-data` at `mikepsinn/optimitron` commit
`06ffef0fa4d9e00dde304c30bf8a8213297cb45b`, and was forked on 2026-10-02. Fixes
are made here; Optimitron keeps its original copy for its own database seed, and the
two are expected to diverge. `manifest.json` records the fork's origin (`forkedFrom`:
source commit, root, and the SHA-256 and size of all 221 original files) and the
current counts.

| Source | Contents |
| --- | --- |
| `medical-data/conditions.json` | 216 conditions, descriptions, synonyms, categories, ICD-10 codes and burden/funding metadata |
| `medical-data/treatments/*.json` | 216 per-condition files, 1,214 treatment comparisons, all outcomes, citations, dosage/duration, response/remission, evidence/confidence fields, counts and health economics |
| `medical-data/treatments/index.json` | Original condition-file index |
| `medical-data/treatments.json` | Original 969-entry cross-condition treatment catalog |
| `medical-data/references.json` | Original 536-entry reference collection, including broader War on Disease policy sources |
| `corrections.json` | Every value changed or verified since the fork, each with a checkable source |

## What the app uses

`lib/demo/treatment-estimates.ts` reads the condition catalog and loads only the
selected condition's treatment file. It validates displayed fields, preserves
other fields, derives URL slugs, and defaults missing outcome lists to empty.
The app never rewrites these files. All 216 conditions and 1,214 labels
are available through `/treatment-rankings` and `/outcome-labels/demo/...`.

The comparison UI includes annual costs and breakdowns, selected cost-effectiveness
details, dose/schedule, time to effect and treatment duration. Cross-condition
catalog/reference pages and the remaining response/access metadata displays still
need integration. The independently imported ClinicalTrials.gov comparison remains
in `../evidence/`, separate from these estimates.

Most values are still unverified AI estimates (`dataSource: "ai-estimated"` or no
source), and most citations are expiring search-redirect links rather than papers.
The display policy is **Current best estimates**; these numbers do not enter empirical
pooling or real participant counts. Source `mixed` / `trial` classifications and claimed
confidence/counts are metadata, not proof of validation. The reference collection
is broader than medicine; do not cite unrelated entries as treatment evidence.

## Correcting a value

1. Find the value in a primary source (FDA label, journal article, registry record).
2. Edit the JSON in place. On the corrected or confirmed outcome or side effect, set
   `dataSource` to the source type (for example `fda-label` or `publication`) and
   `sourceUrl` to a checkable `https://` link. Remove a value rather than keep one
   you cannot source.
3. Add an entry to `corrections.json` (`kind`: `correction` or `verification`) with
   the file, treatment, list, item, field, old and new values, `sourceUrl` and a note
   naming the table or section.
4. Run `pnpm test:unit` and `pnpm type-check` from `apps/web`.

The tests require that every file changed since the fork has a corrections entry,
that every entry's new value is what the file contains, and that every value marked
as verified has a checkable source (search-redirect links do not count).

## Comparing with Optimitron

From `apps/web`, read-only (nothing is copied automatically):

```powershell
node scripts/compare-optimitron-medical-data.mjs E:\code\optimitron --check
node scripts/compare-optimitron-medical-data.mjs E:\code\optimitron --diff
node scripts/compare-optimitron-medical-data.mjs E:\code\optimitron --diff origin/main
```

`--check` confirms the recorded origin matches the source commit byte for byte.
`--diff` lists files changed or added here since the fork and, given a later
Optimitron ref, files changed there; review those by hand. The scoped
`.gitattributes` keeps line endings stable so diffs stay readable.
This is not the future authenticated database/MCP importer.

The source was previously public and copying was requested by its owner. The
inspected source checkout did not have a root license; review redistribution terms
and obligations before publication. No new license is asserted. No application
secrets, private patient records, databases or other Optimitron datasets are copied.
