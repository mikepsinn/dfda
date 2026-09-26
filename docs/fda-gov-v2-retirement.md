# `fda-gov-v2` retirement record

**Decision, 2026-09-26: archive, do not delete or merge wholesale.** The source
remains a private, recoverable reference. [`apps/web`](../apps/web) in
[`mikepsinn/dfda`](https://github.com/mikepsinn/dfda) is the maintained product.
The audit below resolves the old port-candidate checklist; deferred items are
preserved references, not blockers requiring a second active repository.

**Completed:** GitHub confirmed `isArchived: true` and `isPrivate: true` on
2026-09-26. The repository description points to `mikepsinn/dfda`. All 16 remote
branch heads were rechecked against the backup immediately before archiving.

## Shared history and actual divergence

- Source: `mikepsinn/fda-gov-v2`, default branch `develop`,
  `cf29035cce98916bcba21abccfc46d845598f12d` (2025-10-27).
- Destination audited: dFDA `master`,
  `0b47d07fca6642fc29588824de00a621bdd382d2`.
- Common ancestor: `e2abb4d7ce7117c5989c87709b46ac00551a25a2`
  (2025-05-17), with **930 shared ancestor commits** including that commit.
- Default-branch histories contain 1,052 and 1,075 commits respectively:
  122 source-side and 145 destination-side commits after the common ancestor.
  These are reachability counts, not unique-feature counts. The same common
  ancestor exists against dFDA's pre-author-credit-rewrite commit `9f0e1987`;
  the divergence is not merely caused by that rewrite.

Comparing the old `apps/dfda-node` tree with today's `apps/web`, including
configuration and documentation files:

| Comparison | Files |
| --- | ---: |
| Old app | 696 |
| Current app | 629 |
| Identical at corresponding relative paths | 475 |
| Present at corresponding paths but changed | 126 |
| Old paths absent from the current app | 95 |
| Of those absent paths, identical content exists elsewhere in the current app | 7 |

Thus they are closely related, not interchangeable snapshots. The earlier
89-file product-path audit used a different scope. Neither that count nor
the 95-path count means that many unique features need migrating.

The other branches are preserved too: `feature/fda-gov-v2` is contained in
`develop`; `master` has three additional commits and `backup-fda-gov-v2` has
13 not reachable from `develop`. Twelve other heads are dependency-update
branches. No branch was deleted or merged during retirement. Old generated
files, environment files, dependencies, and migration histories must not be
copied into the current product just to make the histories converge.

## Candidate decisions

All source paths in this table are relative to the old repository at the pinned
`cf29035c` commit, not to this repository. An archive preserves them for later
targeted ports. "Existing overlap" means code was compared, not that either
version has passed a fresh end-to-end product test.

| Candidate | Disposition | Evidence and future destination |
| --- | --- | --- |
| Landing comparison, sources, and sticky navigation | **Defer presentation reuse; reject wholesale campaign-copy replacement** | Old `apps/dfda-node/components/landing/{ComparisonTable,SourcesSection,HeroSection}.tsx` and `components/layout/PublicPageStickyNav.tsx`; current app already has landing and how-it-works components. Reuse layout ideas only when implementing the public evidence pages, with reviewed claims and neutral branding. |
| Condition/intervention cards and citations | **Defer UI reuse; reject AI-generated evidence/scoring pipeline** | Old `components/condition/{ConditionInterventionsList,InterventionDetailCard,SourcesDisplay}.tsx` can inform the planned evidence UI. `lib/actions/get-condition-interventions.ts` generates structured AI output; `scripts/generate-intervention-scores.ts` asks a model for 1–10 evidence/benefit/safety scores. Do not port those outputs as measured evidence. |
| Trial search suggestions, filters, result cards and pagination | **Defer a targeted UI port to the planned trial-search work** | Old `app/(public)/find-trials/components/{ConditionSuggestInput,InterventionSuggestInput,trial-results-display}.tsx` has richer controls than the current simple condition-selection form. Its actions use `/api/int/studies` and `/api/int/suggest`; do not adopt these dependencies unchanged. Rewire selected UI to the documented API v2 client selected in [MIGRATION.md](MIGRATION.md#what-comes-from-optimitron), with fresh contract/pagination tests. |
| Image, nutrition-label and webcam capture | **Existing overlap; reject a second capture flow, defer useful refinements** | Current `components/shared/ImageAnalysisCapture.tsx`, `wizard-steps/ReviewNutritionStep.tsx`, `hooks/useImageAnalysisWizard.ts` and `hooks/useWebcam.ts` already cover upload/webcam/review. Preserve old `components/patient/SimpleImageCapture.tsx`, `lib/actions/simple-image-capture-action.ts` and wizard changes as comparison material; no runtime port is needed to archive. |
| Configurable logo/favicon | **Defer to the independent-clinic configuration milestone** | Important path correction: the old implementation is in **old `apps/web/config/site.ts` and `apps/web/env.mjs`**, not old `apps/dfda-node`. Its `NEXT_PUBLIC_SITE_LOGO`/`NEXT_PUBLIC_FAVICON` behavior is a small reference for the [shared configuration model](PRODUCT-ARCHITECTURE.md#white-labeling-and-independent-hosting), not a reason to keep the old app active. |
| Referendum/referral campaign | **Reject as a default clinic feature** | Retain in the archive; an optional public/organization-site feature can be evaluated separately. Do not import its auth/profile/migration changes wholesale. |
| Extra migrations, generated types, infrastructure and lockfiles | **Reject wholesale import** | Current migrations remain in `apps/web/supabase/migrations`. The old app has additional profile/referral/AI-metric schema changes and divergent dependency versions. Any future port needs its own schema/dependency review; no migrations were applied during retirement. |

Except where an app prefix is written explicitly, old node paths above are
relative to `apps/dfda-node` and current app paths to `apps/web`.
Deferred UI work belongs to the [existing product roadmap](MIGRATION.md#order),
not a parallel backlog requiring the legacy app to remain writable. Archive
status must never be presented as evidence that these features were ported.

## Deployment and operational checks

Read-only audit on 2026-09-26:

- Enumerated all **33 Vercel projects** in `mike-p-sinns-projects` and all projects
  in `crowdsourcing-cures` (zero), following pagination. None is Git-linked to
  `mikepsinn/fda-gov-v2` / GitHub repository ID `957228297`.
- `prototype.dfda.earth` is linked to `mikepsinn/dfda`, production branch `master`,
  root `apps/web`. Its current production deployment is `READY` at `0b47d07f`.
  The old-looking `v0-fda-gov-v2.vercel.app` hostname is an alias of that same
  current deployment, not proof of a build dependency on the old repository.
- Current app migrations are owned by this repository. The Vercel project under
  Mike P. Sinn's team holds the current production database/Supabase configuration;
  required environment key names/targets were checked without exporting values.
- Old GitHub Actions has no queued/in-progress run. Available history shows four
  GCP deployment runs with no success and no AWS deployment runs. There are no
  custom repository webhooks. This is an audit of accessible Vercel/GitHub state,
  not a full inventory of independently provisioned AWS/GCP resources.
- The old repository has twelve open dependency-update PRs and no open issues.
  Preserve them read-only; do not merge old dependency branches into dFDA.
- Its historical `DOPPLER_TOKEN` repository secret is left unchanged. Archiving
  is not credential revocation; auditing/rotating external credentials is separate
  work and may affect other systems.

No Vercel project, domain, deployment, database, secret, or local checkout was
deleted or relinked. No application deployment was initiated by the retirement
operation. Documentation pushes may run the existing PR preview workflow.

## Recovery record

The old repository remains private on GitHub. A separate private local mirror
and verified full-history bundle were also created before archiving:

- Directory: `E:/code/dfda-history-backups/fda-gov-v2-retirement-20260926/`
- Mirror: `repository.git`
- Bundle: `all-refs.bundle`
- Captured: all 16 remote branch heads, no tags, and advertised PR refs;
  `git bundle verify` reports 55 entries including HEAD and a complete history.
- `git fsck --full --no-reflogs` passed on the mirror.
- Bundle SHA-256: `daf5fbd2bf6ea30b0628f59b46e2dbac7efab096348a98294841ab269a10d0ce`.

The local backup README gives recovery commands. Git bundles do not contain
GitHub issue/PR discussion metadata or deployment secrets; GitHub archive retains
the repository collaboration history. Historical tracked environment files may
contain sensitive configuration: keep the mirror/bundle private and do not add
them to this repository or a PR attachment.

Unarchive the GitHub repository if edits there are ever necessary, or inspect a
fresh clone of the bundle. Do not force-push the old history over current dFDA.
