# Component Refactoring TODOs

Based on the list generated in `components.md`:

## Component Relocation

- [ ] Move `app/(protected)/patient/treatments/components/condition-combobox.tsx` to `components/condition-combobox.tsx` and update imports.
- [ ] Move `app/(protected)/patient/treatments/components/conditions-list.tsx` to `components/conditions-list.tsx` and update imports.
- [ ] Move `app/(protected)/patient/treatments/components/treatment-search.tsx` to `components/treatment-search.tsx` and update imports.

## Investigate Duplicates & Naming

- [ ] Investigate `components/ConditionSearch.tsx` vs. `components/condition-search.tsx`. Determine if one is obsolete or if they should be merged/renamed consistently.

## Potential Abstraction / Refactoring

- [ ] ~~Review "Wizard" components (`...wizard.tsx`) across different features. Can common multi-step form logic be extracted into a reusable `Wizard` component (e.g., in `components/` or `components/ui/`)?~~ (Decided against this for now - wizards are too distinct).
- [ ] Review various "Dialog" components (`...dialog.tsx`). Ensure consistent use of `components/ui/dialog.tsx` and identify potential redundant patterns.
- [ ] Review wrapper components (`components/ButtonWrapper.tsx`, `components/SearchInputWrapper.tsx`). Determine if their logic is necessary or can be simplified/integrated elsewhere.

## Review Component Placement (Lower Priority)

- [ ] Review components currently in `components/hero/`, `components/how-it-works/`, `components/patient/`. Confirm if they are appropriately placed in the root `components` directory or if they belong closer to the specific routes/pages where they are used (e.g., inside `/app/(public)/components/` or `/app/(protected)/patient/components/`). *Note: Grouping by feature in root subfolders is also acceptable.*

## Cleanup

- [ ] Remove commented-out component imports/usages once refactoring is complete and stability is confirmed (e.g., `PatientConditionsCard`, `TimeField`, etc.).

# Feature TODOs

## Patient Onboarding Flow

- [ ] Design multi-step onboarding UI/wizard.
- [ ] Implement `ConditionSearchInput` within onboarding.
- [ ] Implement `TreatmentSearchInput` within onboarding.
- [ ] Create server action `addInitialPatientConditionsAction`.
- [ ] Create server action `addInitialPatientTreatmentAction` (handling dosage, schedule details, start date, etc.).
- [ ] Create server action(s) or logic to generate default `reminder_schedules` for conditions/treatments added during onboarding.
- [ ] Implement initial treatment rating UI (e.g., using `StarRating`) during onboarding.
- [ ] Add logic to check user onboarding status on login and route to onboarding flow or dashboard.
- [ ] Handle "Condition/Treatment not found" scenarios during onboarding search.
- [ ] Integrate optional data connection step (`/patient/data/import`).

## Patient Tracking Inbox / Reminders

- [ ] Create server action to fetch pending tracking tasks based on `reminder_schedules` (`next_trigger_at`, etc.).
- [ ] Create UI component for the "Inbox" / `TrackingTasks` list.
- [ ] Create UI component/dialog for logging condition severity.
- [ ] Create server action to log treatment adherence ("Did Take" / "Did Not Take" - potentially map to `measurements` or a dedicated log).
- [ ] Integrate "Log Now" actions in the inbox to trigger relevant logging components (e.g., rating dialog, severity logger).
- [ ] Implement "Skip/Later" logic for inbox tasks.
- [ ] Display the Tracking Inbox prominently on the main patient dashboard (`/patient/`).
