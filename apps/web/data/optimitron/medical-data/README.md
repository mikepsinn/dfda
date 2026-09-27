# Medical Dataset Provenance

This directory is a migrated snapshot from `E:\code\dih-neobrutalist`.

Files:

- `conditions.json` — condition index used by DFDA condition pages.
- `treatments.json` — aggregate treatment index across conditions.
- `treatments/*.json` — per-condition treatment evidence files.
- `references.json` — migrated reference data retained with the snapshot.

The per-condition treatment files include `dataSource`, `lastUpdated`, and
citation URLs. Many citation URLs are Vertex AI grounding redirect URLs and
ClinicalTrials.gov links, which means the data was generated from the DIH
grounded medical-data workflow, not hand-authored in Optimitron.

Until the generator is migrated into this repo, treat these files as a static
snapshot. Do not hand-edit individual treatment scores as if they were source
data. If a row is obviously wrong, document the source correction and update
the generator or the upstream DIH snapshot before refreshing this directory.

Validation work should start with stable structural checks: unique slugs,
nonnegative counts, treatment files existing for each condition slug, citations
being present where claimed, and source/provenance fields remaining populated.
Avoid hard-failing incidence/prevalence ratios without disease-duration context;
acute diseases can have many more annual cases than point-prevalent cases.
