# `fda-gov-v2` retirement plan

`apps/web` (formerly `apps/dfda-node`) in this repository is the canonical product. The separate
`mikepsinn/fda-gov-v2` repository is a feature source, not a second product
line. Do not archive it until the items below have been accepted or ported.

## Audited source

- Repository: `mikepsinn/fda-gov-v2`
- Branch: `develop`
- Audited commit: `cf29035cce98916bcba21abccfc46d845598f12d`
- Last source commit: 2025-10-27
- Comparison: its `apps/dfda-node` has 89 product files not present at the
  same paths in the canonical app; many are reorganized duplicates, so this is
  an audit queue rather than a migration count.

## Port candidates

Port these as independent, reviewed slices instead of copying the old app over
the canonical app:

1. The purple-and-white public landing experience, including the evidence
   comparison table, source list, patient/researcher explanations, and sticky
   section navigation. Rework FDA-specific claims and referendum coupling so
   the result remains white-label.
2. Public search and condition detail: the general search page, condition to
   intervention evidence cards, citations, and readable condition URLs.
3. The richer public clinical-trial search flow: condition/intervention
   suggestions, trial-result display, filters, and ClinicalTrials.gov schemas.
4. Optional patient data capture: image-to-measurements, nutrition-label
   parsing, webcam capture, and the review wizard.
5. Configurable logo and favicon behavior for independently branded nodes;
   reconcile it with the shared release/configuration model in
   [Product architecture](PRODUCT-ARCHITECTURE.md#white-labeling-and-independent-hosting),
   not a code fork per clinic.

The referendum voting flow is useful for the public advocacy site, but it is
not a default clinic-node feature. Port it only as an optional public module or
leave it with the existing organization site; it does not require another dFDA app.

## Do not copy blindly

- old lockfiles, dependency versions, generated database types, or editor files
- duplicate Supabase migrations without comparing the live schema and migration
  history first
- deployment identifiers containing `fda-gov-v2`
- obsolete Recaptcha, Redis, or infrastructure scaffolding unless a selected
  feature still requires it

## Archive gate

The old repository can be made read-only after all of these are true:

- each port candidate is marked ported, rejected, or intentionally deferred;
- `prototype.dfda.earth` is Git-connected to this repository after the
  canonical-app pull request is merged;
- no Vercel project or operational workflow deploys from `fda-gov-v2`;
- database migrations and required deployment secrets have a documented owner;
- the final old commit is tagged or otherwise recorded for recovery.

Archive the repository; do not delete it. Git history is cheap insurance for
features that are deliberately left behind.
