# dFDA UI conventions

The existing landing page is the visual reference. Extend its Tailwind theme and
checked-in shadcn primitives; do not introduce a second component library or copy
Optimitron's theme wholesale.

This is the shared design reference for all `apps/web` interfaces, including
public pages, patient/provider/researcher workflows and administration. It is a
baseline to improve, not a claim that every existing screen already meets it.
The shared [repository instructions](../AGENTS.md) link here; do not maintain
separate editor-specific copies of the design rules.
An explicit user design decision takes precedence over these defaults.

## UI change workflow

1. **Inspect before replacing.** Open the relevant route when a runnable preview
   is available. Read its components and find the closest existing pattern.
   Start with the [landing page](../apps/web/app/page.tsx),
   [hero](../apps/web/components/HeroSection.tsx),
   [comparison section](../apps/web/components/ComparativeEffectivenessSection.tsx)
   and [Outcome Label](../apps/web/components/OutcomeLabel.tsx) as visual references;
   do not copy placeholder actions or unsupported claims from a demo.
2. **Reuse before adding.** Prefer an existing feature component, then compose
   [shared primitives](../apps/web/components/ui). Extract a shared pattern when
   multiple screens need it. Do not duplicate an Outcome Label, button system or
   theme for a new route. Keep content/data adapters separate from presentation.
3. **Design for the task.** Use the landing page's visual language, not its
   marketing-page density everywhere. Choose a list, table, form or cards based
   on the information and task. Keep search, comparison and next actions easy to
   reach; decoration must not crowd out useful content.
4. **Verify and refine.** Inspect rendered desktop and mobile screenshots and
   exercise the real user journey. Fix observed issues before handoff. If the
   browser or a dependency is unavailable, say which checks remain unverified.

Changes to shared tokens or primitives affect other screens: inspect representative
consumers before and after. Do not reset shadcn, replace the font/palette, install
a second UI library or redesign the site as a side effect of importing a feature.
If a new pattern materially improves the experience, update the shared component
and this guide in the same change instead of creating a one-off competing pattern.

## Foundations

- Theme tokens live in `apps/web/app/globals.css` and the app's Tailwind config.
  Use `primary`, `background`, `card`, `muted`, `foreground` and their matching
  foreground tokens. Keep emphasis, borders and spacing consistent in both themes.
- The brand mark is the Outcome Label card in `apps/web/components/BrandMark.tsx`, in
  theme colors for the header, menu and footer, or fixed colors for generated images.
  `apps/web/app/icon.svg` is the same drawing for the browser icon; a unit test keeps
  the two in step. Do not use "FDA" in the product name or logo.
- Shared primitives live in `apps/web/components/ui`. Use `Button`, `Card`,
  `Popover` and `Command` before creating feature-specific alternatives.
- Public comparison pages use a `max-w-5xl` reading width, rounded cards, restrained
  purple accents, clear headings and a single-column mobile layout.
- For a full-width section background inside the page container, use the `band-*`
  classes in `apps/web/app/globals.css`. They paint to the window edges without
  widening the page; do not use `100vw` widths or negative side margins.
- Preserve the app's existing typography and consistent spacing/radius scale.
  Use tabular numerals for comparable measurements. Reserve semantic colors for
  meaningful states and pair them with text, never color alone.

## Actions and links

- Primary buttons advance the main task: compare treatments or search trials.
- Outline buttons open details or supporting sources; ghost buttons go back or
  jump to another section. Inline prose links can remain links, not every anchor
  needs a button.
- Use `Button asChild` with `Link` or an anchor for navigation. Never nest a button
  inside a link. Use real buttons for form submission and interactive controls.
- Preserve keyboard focus, descriptive names and comfortable touch targets.
  Decorative icons have `aria-hidden`. Long labels must wrap without overflow.
- Use visible field labels, semantic heading order, readable contrast and
  keyboard-operable controls. Check long names, text zoom and reduced-motion
  preferences where applicable. Do not use placeholder links or nonfunctional
  buttons to make a screen look complete.
- Provide purposeful loading, empty, no-match, error and success states for the
  behavior a screen supports, with a clear recovery action where possible.

## Treatment comparison components

- `components/demo/condition-picker.tsx`: searchable condition/synonym index,
  keyboard selection and a hidden value submitted by the surrounding GET form.
  Only this index reaches the client; treatment files are loaded server-side.
- `components/demo/treatment-scores.tsx`: shared 0–100 score display. These are
  scores, not response rates. Bars are decorative; text carries the values.
- `components/OutcomeLabel.tsx`: existing landing-page label, also used through
  `components/demo/treatment-outcomes.tsx`. Changes retain their signs; frequency
  values are explicitly separate. Missing values are not zero. Outcome change
  bars are disabled for imported records, which can exceed 100%.
- `components/demo/health-economics.tsx`: annual cost and breakdown, with secondary
  cost-effectiveness details collapsed. USD follows the upstream display convention;
  records are snapshot estimates, not current price quotes. Do not invent a total
  from missing parts. Display ICER only with a named comparator; a negative ICER
  alone does not establish dominance or good value. Upstream ratings, prescription
  access models and missing comparator assumptions are not silently promoted to
  conclusions. All original fields remain in the source copy.
- `components/demo/rankings-preview.tsx`: landing-page preview of the top snapshot
  estimates for a few example conditions. `lib/demo/landing-preview.ts` passes only
  summary rows to the client; the full rankings stay on `/treatment-rankings`.
- `components/how-it-works/ExampleDataTag.tsx`: small “Example data” caption under
  a mock-up screen that shows outcome or effectiveness numbers, so previews of planned
  features are not read as real evidence. Steps opt in with `exampleData`; forms,
  schedules, chats and operational screens need no caption.
- `components/demo/estimate-notice.tsx`: one compact “Current best estimates”
  notice per page. Source metadata stays in the data/manifest and technical notes,
  not a repetitive provenance wall.
- `components/demo/trial-result.tsx`: separately sourced posted results, with an
  original-results action and expandable endpoint/analysis detail. Never relabel
  copied trial/participant counts as verified evidence.

The working examples are `/treatment-rankings?condition=insomnia`,
`/outcome-labels/demo/insomnia/suvorexant`, and the landing page's existing label.
These render local files without model calls. No dependency or theme reset is needed.

## Definition of done

For UI implementation changes, include this evidence in the handoff or PR:

- [ ] Existing components/patterns inspected and reused, or the reason for a new
  shared pattern explained. No unrelated theme/dependency changes.
- [ ] Changed routes visually inspected at desktop (around 1280px) and narrow
  mobile (around 390px), including relevant expanded/open states. Screenshots
  captured and inspected; no clipping or unintended horizontal overflow.
- [ ] Primary journey exercised through its real controls, including navigation,
  form submission and keyboard/focus behavior. Links lead to the intended target.
- [ ] Applicable empty/loading/error states and long/missing/zero values checked.
  Disabled, unavailable and demo-only actions are honest about their behavior.
- [ ] The pull request's "Visual preview" comment shows the expected before/after
  screenshots. If the change affects a page that the preview does not cover, add
  its route to `apps/web/scripts/visual-preview.mjs`.
- [ ] Browser errors checked. Relevant unit tests and `pnpm type-check` run from
  `apps/web`; lint/build run where applicable. Failed and unrun checks are listed
  separately; pre-existing blockers are not reported as passing.
- [ ] Representative consumers rechecked if a shared component or theme changed.

Documentation-only changes need link/rule consistency checks, not a new browser
run. Visual review is required for implemented UI changes; a screenshot by itself
does not prove the interaction works.

### Treatment-data checks

Run unit tests and type checking in `apps/web`. Check desktop and mobile views,
long names, search by alias, no matches, keyboard selection, sort submission,
label/back navigation, cost expansion and the source-result link. Inspect screenshots,
browser errors and horizontal overflow. Test missing and zero values separately.
Recheck the landing-page label when changing the shared renderer. Source snapshot
checksums must stay unchanged. Browser checks do not substitute for source review
or clinical validation.
