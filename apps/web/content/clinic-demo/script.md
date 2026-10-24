# The clinic demo: journey script

The single source for the demo of a company instance: what a patient, a clinician and the clinic's
owner do, and what each of them must see. The tour test
([`tests/e2e/tour.test.ts`](../../tests/e2e/tour.test.ts)) follows these steps in this order, checks
each **Must see**, and shows each **Caption** when it records the demo videos. Change the journey
here first, then the tour.

The demo clinic is Acme Metabolic and its GLP-1 weight program
([`lib/demo/clinic.ts`](../../lib/demo/clinic.ts)). All people and values are made up. The demo
sign-in on `/login` opens it as the patient, the clinician or the owner, on any deployment.

Rules for this file:

- Each step is a level-3 heading `### <journey>-<number>: <title>`, followed by the four fields
  below. The tour reads the caption by the step's id, and a unit test checks that every step here
  has a step in the tour and the other way round.
- **Caption:** at most 140 characters, so that it fits two lines on a phone.
- **Must see** names text or controls on the page, not colors or positions, so that a theme change
  does not break the tour.

To record the videos: `pnpm demo:video` in `apps/web`, with the setup of the browser tests
([`playwright.config.ts`](../../playwright.config.ts)), or run the "Demo videos" workflow on
GitHub. The tests run the patient's journeys at phone size and the others at desktop size. The
videos show every journey at one 16:9 desktop size (1920×1080), so that the text is easy to read
on any screen.

## Patient: Riley Lee, on a phone

Riley joined the program 12 weeks ago. The clinic has saved Riley's week-12 biomarker report, and
the care team has not reviewed it yet.

### patient-1: Finds the clinic's program

- **Page:** the clinic's home page, signed out.
- **Action:** opens the programs.
- **Must see:** the clinic's name and tagline, and the "GLP-1 weight program" card.
- **Caption:** Riley finds Acme Metabolic's GLP-1 program on the clinic's own site.

### patient-2: Reads what joining means

- **Page:** the program page.
- **Action:** reads the page; does not join (Riley joined 12 weeks ago).
- **Must see:** "What you do", "What you get", what the clinic sees, and that the care team adds
  and reviews the reports in this program.
- **Caption:** Before joining, Riley sees what to track, what comes back, and that the clinic's care team reviews the reports.

### patient-3: Opens the program at week 12

- **Page:** the sign-in page, then the program on the clinic's site.
- **Action:** signs in as the demo clinic patient.
- **Must see:** "Your follow-up is due", and that the reports are shared with the care team.
- **Caption:** Twelve weeks later, Riley's follow-up is due.

### patient-4: Records today's values

- **Page:** the program, "Record a day".
- **Action:** saves today's dose, weight, energy and nausea.
- **Must see:** that the values are saved.
- **Caption:** Each week Riley logs the dose and weight, and each day energy and nausea. Reminders come at 09:00 and 20:00.

### patient-5: Sees before and now

- **Page:** the program, "Before and now".
- **Action:** reads the results.
- **Must see:** "of 4 measures improved" or similar, and the weight row with its trend.
- **Caption:** Riley sees each measure at the start and now, with a trend line. A change in one person does not prove what caused it.

### patient-6: Opens the biomarker report

- **Page:** the program's reports, then the week-12 report.
- **Action:** opens the latest report.
- **Must see:** the report's title, "At a glance", the clinic's lab values, and the report's review
  status.
- **Caption:** Riley sees the week-12 biomarker report as soon as the clinic saves it, with its review status.

### patient-7: Saves the report for their own doctor

- **Page:** the report.
- **Action:** finds the print button.
- **Must see:** "Print or save as PDF".
- **Caption:** Riley can print the report or save it as a PDF for their own doctor.

## Clinician: Dr. Sam Okafor, on a desktop

Dr. Okafor is on Acme Metabolic's care team. The care team sees only the patients who share their
reports with it.

### clinician-1: Opens the care team's patients

- **Page:** the sign-in page, then the care team's patients on the clinic's site.
- **Action:** signs in as the demo clinic clinician.
- **Must see:** the patients who share, each with their program and week, the patients with
  reports to review first, and Riley Lee with "1 report to review".
- **Caption:** Dr. Okafor sees only the patients who share their reports with the care team. The reports that wait the longest come first.

### clinician-2: Opens Riley's case: Baseline

- **Page:** Riley's case in the care area, in four chapters: Baseline, Track, Follow-up and Decide.
- **Action:** opens Riley.
- **Must see:** the chapters, Riley's card with the program and dates, the baseline sample, and the
  timeline from the baseline to the follow-up with a dot for each sample.
- **Caption:** Riley's case opens on the baseline: the program, the first sample, and a dot for each sample up to the follow-up.

### clinician-3: Track

- **Page:** the same case, "What surrounded the change".
- **Action:** opens the Track chapter.
- **Must see:** the dose steps, the check-ins that Riley logged and the reported effects, on the weeks
  of the samples.
- **Caption:** Every dose, check-in and reported effect sits on the same weeks as the blood samples.

### clinician-4: Follow-up

- **Page:** the same case, the latest report by pathway.
- **Action:** opens C-reactive protein from the Inflammation panel, then the studies behind its expected change.
- **Must see:** the four largest changes, the panels with each protein in its status color, the chart
  of C-reactive protein with Riley's noise band, and the sources: Verma et al. 2022 and Plutzky et al. 2026.
- **Caption:** Grouped by pathway, not a single score. Each protein shows its values, Riley's noise and the studies behind it.

### clinician-5: Asks about the report

- **Page:** the same case, the Decide chapter, "Ask about this report".
- **Action:** chooses the question "Which changes should I look at first, and why?" and asks it.
- **Must see:** the answer, with a numbered source after each part: quotes of the report and pages of
  the medical literature.
- **Caption:** Dr. Okafor asks about the report. The answer cites the report and the medical literature for each part.

### clinician-6: Decides and signs off

- **Page:** the same case, the clinician note.
- **Action:** adds the plan to the draft note, chooses "Continue", confirms the review and signs off.
- **Must see:** the note drafted from the report, "Edited by clinician", "Reviewed by clinician",
  then "Reviewed by Dr. Sam Okafor", the note and "Decision: Continue".
- **Caption:** The note starts as a draft from the report. Dr. Okafor adds the plan and signs off. Riley sees the note, not the decision.

## Patient: Riley gets the review

### review-1: Sees the clinician's note

- **Page:** the report on the clinic's site.
- **Action:** signs in as the demo clinic patient and opens the report.
- **Must see:** "Reviewed by Dr. Sam Okafor" and the note, and no decision.
- **Caption:** Back on the clinic's site, Riley sees who reviewed the report, when, and the note.

## Owner: the clinic's owner, on a desktop

### owner-1: Sees the clinic's programs and care team

- **Page:** the sign-in page, then the clinic's page for companies.
- **Action:** signs in as the demo clinic owner.
- **Must see:** the clinic's name, the GLP-1 program, and the care team with Dr. Sam Okafor.
- **Caption:** The owner runs the clinic's programs and its care team.

### owner-2: Sees the program's totals

- **Page:** the program's page for companies.
- **Action:** opens the GLP-1 program.
- **Must see:** the totals per measure, and that the owner sees totals only.
- **Caption:** The owner sees totals per measure, never one person's values.
