# Complete Optimitron medical dataset

`medical-data/` is a byte-for-byte copy of the **entire** upstream directory
`packages/data/src/datasets/medical-data` at `mikepsinn/optimitron` commit
`06ffef0fa4d9e00dde304c30bf8a8213297cb45b`. All 221 files are retained, including
the upstream README. `manifest.json` records the source, file sizes, SHA-256 hashes
and counts. The directory was unchanged between that pin and the source checkout
inspected on 2026-09-27 (`36f72dfca45987e336f33adea3880d54a1b2db4b`).

| Source | Contents |
| --- | --- |
| `medical-data/conditions.json` | 216 conditions, descriptions, synonyms, categories, ICD-10 codes and burden/funding metadata |
| `medical-data/treatments/*.json` | 216 per-condition files, 1,214 treatment comparisons, all outcomes, citations, dosage/duration, response/remission, evidence/confidence fields, counts and health economics |
| `medical-data/treatments/index.json` | Original condition-file index |
| `medical-data/treatments.json` | Original 969-entry cross-condition treatment catalog |
| `medical-data/references.json` | Original 536-entry reference collection, including broader War on Disease policy sources |

This replaces the discarded three-condition projection. There is no second
generated subset to keep synchronized. The former 19 comparisons are preserved
in the complete source files, not deleted from the product.

## What the app uses

`lib/demo/treatment-estimates.ts` reads the condition catalog and loads only the
selected condition's treatment file. It validates displayed fields, preserves
other fields, derives URL slugs, and defaults missing outcome lists to empty.
Source JSON is never rewritten by the app. All 216 conditions and 1,214 labels
are available through `/treatment-rankings` and `/outcome-labels/demo/...`.

The comparison UI includes annual costs and breakdowns, selected cost-effectiveness
details, dose/schedule, time to effect and treatment duration. Cross-condition
catalog/reference pages and the remaining response/access metadata displays still
need integration; copying their data alone does not implement those features.
No source citations are silently promoted to
verified supporting evidence. The independently imported ClinicalTrials.gov
comparison remains in `../evidence/`, separate from these estimates.

All original origin labels, dates and citations remain intact. The display policy
is still **Current best estimates**; these numbers do not enter empirical pooling
or real participant counts. Source `mixed` / `trial` classifications and claimed
confidence/counts are metadata, not proof of validation. The reference collection
is broader than medicine; do not cite unrelated entries as treatment evidence.

## Preview, copy and verify

From `apps/web`:

```powershell
node scripts/import-optimitron-medical-data.mjs E:\code\optimitron --preview
node scripts/import-optimitron-medical-data.mjs E:\code\optimitron --write
node scripts/import-optimitron-medical-data.mjs E:\code\optimitron --check
pnpm test:unit
pnpm type-check
```

No flag means preview. `--write` copies the pinned files without stripping fields;
it refuses to overwrite locally edited/unrecorded files or silently delete files
removed upstream. `--check` compares the complete inventory and bytes with Git.
Unit tests verify the saved checksums offline and load every condition/comparison.
The scoped `.gitattributes` prevents Windows line-ending changes to source bytes.

To revise numbers, update the upstream generator/source or build an explicitly
versioned correction layer. Do not silently hand-edit this checksummed snapshot.
Changing the source pin requires reviewing its file inventory, data and manifest.
This copy mechanism is not the future authenticated database/MCP importer.

The source was previously public and copying was requested by its owner. The
inspected source checkout did not have a root license; review redistribution terms
and obligations before publication. No new license is asserted. No application
secrets, private patient records, databases or other Optimitron datasets are copied.
