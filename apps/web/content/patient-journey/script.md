# The patient journey: presentation script

The single source for the Care-Integrated Clinical Trials patient journey deck and the explainer
video in [`videos/right-to-trial`](../../../../videos/right-to-trial/README.md). Change the story
here first, then rebuild the deck and the video from it.

The deck is the web app page `/present/patient-journey`
([slides](../../components/present/patient-journey/slides.tsx)). It reads each slide's eyebrow,
title (or headline), subtitle, speaker notes and source line from this file, so edits to those show
up on the next build. The rest of each slide's text is in its component. Keep slide numbers in
step: the page fails to build if a slide here has no component or a component has no slide here.
Keys: arrows or space move between slides, N shows the speaker notes, F goes full screen, and
printing saves a PDF with one page per slide.

**This version:** improved draft 2, for legislators and advocates (October 3, 2026), with plainer
slide text. The git
history has the earlier versions: the original deck, "Right to Trial: The Patient Journey"
(October 1, 2026, in [`original/`](original/)), transcribed as it was, then the deck as published
on claude.ai.

Each slide has:

- **Purpose:** the question the slide answers for the audience.
- **On screen:** the slide's text, top to bottom.
- **Visual:** what the slide shows, for whoever rebuilds it.
- **Speaker notes:** what the presenter says, and the background for questions.
- **Video narration:** the voiceover, for slides the video uses.
- **Source line:** the citation printed on the slide, if any.

Recurring design: the web app's theme and font (Inter), with a soft purple gradient on content
slides and the app's dark theme for the title, the statistics slide and the close. Purple is the
primary color and amber the highlight. A "patient path" (a dotted zigzag line through six icon
circles, one per step, ending in an amber star) stands for the six steps. Slides showing the
prototype render the app's own components with its data, not screenshots.

## Brief

- **Audience:** state legislators, their staff, and the patient advocates and caregivers who talk
  to them. Smart non-experts. They will ask: does it work, is it safe, who pays, what does it cost
  the state, and who is against it?
- **They should leave knowing three things:**
  1. Many cheap existing drugs might help patients like Margaret, but nobody tests them: nobody
     can profit from it, and nobody records what happens to patients who take them.
  2. Building trials into everyday care already works (RECOVERY).
  3. The act lets any patient get a screened treatment through their own doctor, lets clinics
     charge enough to offer it, and publishes every result.
- **They should feel:** that this is common sense, safe and proven. Calm confidence, not fear or
  outrage.
- **The ask:** patients, families, doctors and clinics register their interest at
  acceleratedmedicine.org. The initiative is a 501(c)(3). Describing the act is education.
  Presenting it to legislators is direct lobbying, which is allowed within limits. Asking the public
  to contact legislators would be grassroots lobbying, so the public materials do not. Confirm with
  counsel.
- **Tone:** plain and factual. No music in the video and no dramatic openers.
- **Numbers:** only sourced, checkable figures in the main story, each shown against today where
  that tells its size ("82 times less than a typical trial"). Model estimates go in the backup
  slides, labeled as model estimates.
- **Slide text:** say why in one plain sentence ("X, so Y"). Cut what does not change the meaning,
  such as ages, places, dates and "estimate", and leave it to the speaker notes. Eyebrows name the
  idea ("Proof pragmatic trials work", not "Proof it works").
- **Words:** "care-integrated clinical trials". Use "try" only for the federal Right to Try law,
  and describe that law accurately ("life-threatening", not "dying").

## Open items

- **Title wording** (slide 1).
- **State figures:** add figures for the state where the deck is presented (slide 3).
- **Bill text:** check slide 18 against the bill, and name the bill and state on it. Confirm the
  price and liability provisions (slides 12 and 18).
- **Backup B2:** the notes say 44.8% of people with a chronic disease would join a trial.
  Research!America (2023) found 79% of U.S. adults very or somewhat likely to join if their doctor
  recommended it. Confirm the model's source.
- **Real people:** a real patient or caregiver could join or replace Margaret later.
- **Length:** 19 main slides. For a 10-minute meeting, candidates to cut are 3, 7, 12 and 16.

## Changes from the published deck

- New title; the "Your grandmother doesn't have 443 years" cover is gone, and its figures move to
  backup.
- Margaret's claim is fixed. Her doctor can already prescribe approved drugs off-label, so her
  problem is no evidence and no records, not that she "cannot get" them.
- The three problems are reframed. Right to Try is described accurately and appears once.
- New slides: RECOVERY as proof, the three changes stated up front, and what the act does.
- The ranking and label slides use the prototype's real Alzheimer's data instead of depression and
  an invented label.
- "Dying" is gone from Margaret's year and the close.
- The model estimates (0.34% tested, 36 vs 443 years, $9.50 per healthy year) move to backup.
- The close asks people to register their interest.
- The journey has six steps, not seven: the payment slide is gone, and the cost is part of the
  consent step. Its questions (who pays, exploitation, liability) are in the notes of slide 18.

---

## 1. Title

**Purpose:** Name the initiative and the idea in one line.

**On screen**

- Eyebrow: THE CARE-INTEGRATED CLINICAL TRIALS INITIATIVE
- Title: Every patient's treatment can help the next patient
- Subtitle: Radically accelerating medical discovery by letting any patient join trials of the
  most promising treatments.

**Visual:** Dark. The patient path runs across the top. Amber eyebrow, large white title and a
muted subtitle, left-aligned in the lower half.

**Speaker notes:** This deck shows what care-integrated clinical trials would mean for one patient,
Margaret, and why they would help everyone after her. There are three ideas: any patient can get a
screened, promising treatment through their own doctor; clinics can charge enough to offer it; and
every result is published, so the next patient chooses better.

## 2. Meet Margaret

**Purpose:** Make the problem concrete with one person.

**On screen**

- Eyebrow: MEET MARGARET
- Margaret, 68
- Margaret has Alzheimer's disease. Researchers have identified 573 existing drugs that might help
  her. Few have ever been tested for Alzheimer's.
- Card "TODAY": No evidence. No approved drug has helped her, and no trial is open near her. Her
  doctor has no evidence for any of the 573, and if she takes one, nobody records what happens.
- Card "WITH CARE-INTEGRATED TRIALS": Treatment through her own doctor. Her doctor can recommend a
  screened treatment at a local clinic, and her result helps the next patient.

**Visual:** Left, a large white card with a round cartoon avatar of an older woman (grey hair,
glasses, purple top), her name in large type, and the body text with "573 existing drugs" and "Few have
ever been tested" in bold. Right, two stacked cards: a white "Today" card with a lock icon, and a
lavender "With care-integrated trials" card.

**Speaker notes:** Margaret is a composite, made up to make the journey concrete, but her situation
is common: a progressive disease, approved drugs that did not help, and many promising generic
drugs that nobody sponsors. A ten-year review (Frontiers in Pharmacology, 2023) found 573 existing,
prescribable drugs proposed for Alzheimer's; few have been tested in trials. Expect the objection
that her doctor can already prescribe approved drugs off-label. That is true, but without trial
evidence few doctors will, insurers often won't pay, and nobody records what happens, so nobody
learns which drugs work.

**Video narration:** Margaret is 68 and has Alzheimer's. Researchers have identified 573 existing
drugs that might help her. Few have ever been tested for Alzheimer's, so her doctor has no evidence
to recommend any of them. And if she takes one anyway, nobody records what happens.

**Source line:** Frontiers in Pharmacology, 2023, ten-year review of drug repurposing for
Alzheimer's. Margaret is a composite patient.

## 3. Millions of patients

**Purpose:** Show that Margaret stands for millions, with checkable numbers.

**On screen**

- Title: Millions of patients are waiting
- 7.4M: Americans with Alzheimer's
- 30M: Americans with a rare disease
- 2.1M: Americans diagnosed with cancer each year
- 95%: of rare diseases have no FDA-approved treatment

**Visual:** Dark. Under the title, a band of faint dots suggesting a crowd. Four columns, each
with an amber rule above a large amber number and a white label.

**Speaker notes:** An estimated 7.4 million Americans aged 65 or older live with Alzheimer's
(Alzheimer's Association, 2026 Facts and Figures), about 30 million Americans live with a rare
disease (NIH), and about 2.11 million new cancer cases are projected in the U.S. in 2026 (American
Cancer Society, Cancer Statistics 2026). Fewer than 5% of more than 10,000 known rare diseases
have an approved treatment.

**Source line:** Sources: Alzheimer's Association, 2026 Facts and Figures; NIH; American Cancer
Society, Cancer Statistics 2026.

## 4. Why promising treatments go untested

**Purpose:** Explain the causes, so the fix makes sense.

**On screen**

- Title: Why promising treatments go untested
- No one pays to test old drugs. 573: drugs proposed for Alzheimer's are mostly untested, because
  no company can profit from testing a drug it can't patent.
- No one learns from patients. 99.8%: of Alzheimer's patients are in no study, so nothing is
  learned from their treatment.
- Right to Try gives makers no incentive. 21: drugs made available to patients in over six years,
  because the federal law lets drug makers charge only their costs.

**Visual:** Three white cards side by side, each with a heading, a large purple number and
one sentence.

**Speaker notes:** One: no financial incentive. Many of the 573 drugs are off patent, so no company
can earn back the cost of a trial. Two: no learning. Only about 12,000 of about 7.4 million
Americans with Alzheimer's join a trial each year (USC Schaeffer Center; Alzheimer's Association,
2026), so about 99.8% are treated outside any study, and nobody records, pools or publishes their
results. Three: the federal Right to Try Act (2018) lets a patient with a life-threatening illness,
who has used up approved options and cannot join a trial, ask a maker for a drug that has passed
Phase I and is still in development. The maker does not have to agree, may charge only its direct
costs, and collects no outcomes. FDA reports only 21 investigational drugs used under the law from
May 30, 2018 to December 31, 2024, and does not publish how many patients got them
(https://www.factcheck.org/2026/06/no-evidence-for-trumps-right-to-try-claim/). It does not cover
existing drugs like the 573 at all.

**Video narration:** There are three reasons. Old drugs can't be patented, so no company pays to
test them. Almost no Alzheimer's patients are in any study, so nobody learns from their treatment.
And the federal Right to Try law lets drug makers charge only their costs, so they have no reason
to take part: only 21 drugs have been made available in over six years.

**Source line:** Sources: Frontiers in Pharmacology, 2023; USC Schaeffer Center; Alzheimer's
Association, 2026 Facts and Figures; FDA right-to-try summary, via FactCheck.org, 2026.

## 5. It has worked before

**Purpose:** Prove that trials built into everyday care work, quickly and cheaply.

**On screen**

- Eyebrow: PROOF PRAGMATIC TRIALS WORK
- Title: A trial built into everyday care saved a million lives
- How RECOVERY worked: any NHS hospital could enroll patients during their normal care, with little
  extra paperwork, and outcomes came from routine health records.
- 89 days: to show that a cheap steroid cuts deaths among the sickest COVID patients by up to a
  third. Typical trials take years.
- 4: treatments found that save lives, out of more than a dozen tested side by side.
- $500: per patient, 82 times less than the $41,000 of a typical trial.

**Visual:** Cream. The "How RECOVERY worked" line as a caption, then three white cards side by
side, each with a large number and one sentence: "89 days" and "4" in purple, "$500" in amber.

**Speaker notes:** RECOVERY (Randomised Evaluation of COVID-19 Therapy) was a pragmatic trial: it
was built into normal hospital care across the NHS. Any hospital could join, enrolling a patient
took little extra work, and outcomes such as death came from routine NHS records, so patients
needed no extra visits. The first patient joined on March 19, 2020, about nine days after the
protocol was drafted, and over 11,000 had joined by early June. On June 16, 89 days after the
first patient, it showed that dexamethasone, an inexpensive steroid used for decades, cut deaths by
a third in patients on ventilators and by a fifth in those on oxygen. It was in NHS treatment
guidance within hours, and NHS England estimates it saved about a million lives worldwide by March
2021. RECOVERY tested treatments side by side, dropping those that failed and adding new ones. Of
more than a dozen tested for COVID-19, four save lives: dexamethasone, tocilizumab, baricitinib and
an antibody combination (casirivimab and imdevimab). Others, including hydroxychloroquine, did
not help. It cost about $500 per patient, 82 times less than the median of about $41,000 per
patient in the trials behind new FDA approvals. Care-integrated clinical trials apply the same idea
to everyday care, for every disease.

**Video narration:** It doesn't have to be this way. In 2020, Britain built a clinical trial into
ordinary hospital care. In under three months, it showed that dexamethasone, a cheap steroid used
for decades, cut deaths among the sickest COVID patients by up to a third. It saved about a million
lives.

**Source line:** Sources: RECOVERY Collaborative Group, New England Journal of Medicine, 2021;
NHS England, 2021; Manhattan Institute, 2023; Moore et al., JAMA Internal Medicine, 2018.

## 6. The idea

**Purpose:** State the fix in three parts before the walkthrough.

**On screen**

- Eyebrow: CARE-INTEGRATED CLINICAL TRIALS
- Title: Do the same for every disease, in everyday care
- **Any patient** can get the most promising treatments through their own doctor, after
  independent review and with written consent.
- **Clinics can charge a fair price,** so they have a reason to offer treatments nobody else will
  fund.
- **Every result is published,** good or bad, so the next patient chooses better.

**Visual:** Three columns, each with a round purple icon (a person, a clinic, a document) above a
bold lead-in and one sentence. The same icons return on the closing slide.

**Speaker notes:** These three changes are the whole idea. The rest of the deck shows them through
Margaret's first year.

**Video narration:** Care-integrated clinical trials would do the same for every disease, in
everyday care. Here's Margaret's year.

## 7. How it works

**Purpose:** Show the whole journey before the detail.

**On screen**

- Eyebrow: HOW IT WORKS
- Title: Six steps that help the next patient
- 1 Explore options: Compare treatment rankings and outcome labels
- 2 Talk with your doctor: Get a recommendation and decide on a treatment plan
- 3 Consent and cost: Decide in writing, knowing the price
- 4 Treatment and tracking: Share good and bad outcomes
- 5 Results reported: De-identified, in a public registry
- 6 Rankings and labels improve: The next patient chooses better
- Then it starts again, with better data

**Visual:** Six numbered cards in a U-shaped flow joined by purple arrows: steps 1 to 3 left to
right on the top row, down to step 4, then right to left through 5 and 6 on the bottom row. Step 6
is filled purple with an orange star. An orange arrow leads from step 6 back up to step 1, labeled
"Then it starts again, with better data".

**Speaker notes:** Here is the whole path. Steps 1 to 4 are what Margaret does. Every treatment she
can choose has already been screened by an independent review board. In step 5, her results are
de-identified and go to a public registry. In step 6, everyone's pooled results update the
treatment rankings and outcome labels. The next patient starts at step 1 with better data than
Margaret had.

## 8. Step 1: explore options

**Purpose:** Show what Margaret sees, in the working prototype.

**On screen**

- Eyebrow: STEP 1 · EXPLORE OPTIONS
- Title: Margaret starts by comparing her options
- Rankings and outcome labels: compare benefits, side effects and costs.
- Public directory: every participating clinic, with location and status.
- Pre-screened: an independent board approves every treatment first.
- Tag: Prototype · preliminary estimates, not medical advice

**Visual:** The prototype tag and a caption ("the top 3 of 6 treatments by estimated
effectiveness"), then the prototype's own ranking cards for the top three Alzheimer's treatments,
large enough to read: Donanemab (effectiveness 57, safety 48, $38,000 a year), Lecanemab (55, 50,
$36,500) and Donepezil (45, 60, $525). The three features run along the bottom with lavender
icons.

**Speaker notes:** This is the working prototype. It ranks Alzheimer's treatments by estimated
effectiveness and safety, on 0 to 100 scores rather than response percentages, and labels them as
preliminary estimates. Today it lists approved drugs. In a care-integrated system, screened
experimental and repurposed treatments would appear beside them, with their evidence strength
shown. A public directory lists every participating clinic, with its review board, protocol and
status.

**Video narration:** She starts by comparing her options: treatments ranked side by side, each with
an outcome label showing who improved, the side effects, the cost and how strong the evidence is.
(Existing v3 audio.)

## 9. Outcome labels

**Purpose:** Show what an outcome label is, with real data.

**On screen**

- Eyebrow: OUTCOME LABELS
- Title: A label that gets better with every patient
- Where the evidence comes from: Clinical trials, including the ones that failed. Every treated
  patient's real-world outcome. Side-effect reports from clinics and doctors.
- Caption: Lecanemab's label in the prototype, from its FDA label and published trial.

**Visual:** The prototype's Lecanemab outcome label, drawn by its own components: effectiveness
55/100 and safety 50/100 across the top, the primary outcomes on the left (CDR-SB +27%, 0.45 points
less decline than placebo) and the side effects on the right (infusion reactions 26%, brain
swelling (ARIA-E) 13%, brain bleeding (ARIA-H) 17%, headache 11%), each with its "Source: FDA
label" link. The caption sits under the label, and the three evidence sources run along the
bottom with amber icons.

**Speaker notes:** An outcome label puts what is known about a treatment on one page: how much it
helps and compared with what, its side effects, its cost, and how strong the evidence is. This one
is real: Lecanemab's values come from its FDA prescribing information and published trial, checked
in October 2026. Today labels draw on trials alone. In a care-integrated system, every treated
patient's de-identified outcome is added, so the label improves with each patient, including for
old drugs that nobody would fund a trial for.

## 10. Independent treatment review

**Purpose:** Answer "who decides a treatment is safe enough to offer?"

**On screen**

- Eyebrow: INDEPENDENT TREATMENT REVIEW
- Title: An independent board approves every treatment first
- Who reviews: A physician, an outcomes researcher and an ethicist. No financial ties to the
  clinic or maker. Flat fees, never paid per approval.
- What they check: The evidence. The treatment plan. Each provider's competence. Conflicts of
  interest. The consent form.
- What qualifies: Passed Phase I safety testing in people. Or a documented record of safe use in
  people.

**Visual:** Three white cards side by side, each with a small round icon, a heading and a
bulleted list.

**Speaker notes:** Margaret never has to do this herself: every treatment is screened before it is
offered to any patient. The Experimental Treatment Review Board, or ETRB, has at least three
members, including a physician, an outcomes researcher and an ethicist, with no financial ties to
the provider or manufacturer. One approval can cover many qualified clinics. Qualifying pathways: a
Phase I or comparable early human study, a documented human safety record, a well-characterized
platform or individualized treatment, or device-specific evidence.

**Video narration:** An independent board has already screened every option. (Existing v3 audio.)

## 11. Step 2: talk with your doctor

**Purpose:** Show how simple access is for the patient.

**On screen**

- Eyebrow: STEP 2 · TALK WITH YOUR DOCTOR
- Title: Her own doctor recommends it, even by video
- Required: Her doctor's recommendation. Her written consent, which she can sign online.
- Not required: A life-threatening illness. Being unable to join a trial. Using up approved drugs
  first.

**Visual:** Left, an illustration of a laptop showing a video call between a doctor and a patient.
Middle, a lavender "Required" card with a check icon. Right, a white "Not required" card with an
orange prohibition sign.

**Speaker notes:** The bar is deliberately simple: a treating physician's recommendation plus
written consent, which can happen by telemedicine and be signed electronically. No diagnosis,
medical necessity, severity, terminal condition, treatment purpose, trial ineligibility, or
exhaustion of approved options is required. The slide shows the three that federal Right to Try
requires. A doctor who only recommends or discusses the treatment does not have to register or
appear in the directory.

**Video narration** (covers slides 11 and 12): Her own doctor recommends one over a video visit,
and she signs a plain-language consent: the risks, the unknowns, who pays, and that it's
experimental. A charity helps her pay, and no insurer or state program has to.

## 12. Step 3: consent and cost

**Purpose:** Show that she decides with the full picture, including the price.

**On screen**

- Eyebrow: STEP 3 · CONSENT AND COST
- Title: She decides in writing, knowing the price
- Form header: CONSENT FORM · EXPERIMENTAL TREATMENT
- 1 The exact treatment. 2 Her doctor's view of realistic outcomes. 3 Other options, including
  none. 4 Known and unknown risks. 5 Who pays, and what she may owe. 6 What data is collected, and
  how it's protected.
- Chip: If she can't consent, a legal representative can.

**Visual:** A wide white form card with the six items in a numbered three-by-two grid, and a
rounded chip with a small icon beneath it.

**Speaker notes:** The slide groups the nine items in the written consent. In plain language: the specific
treatment; the doctor's view of realistic outcomes; alternatives, including no treatment; known
risks and benefits; unknown risks, regulatory status, and that early evidence does not prove
safety or effectiveness; that the choice is voluntary; who pays and what she may owe; what outcome
data is collected, coded and published only de-identified; and a clear statement that this is
experimental treatment. Recording needs separate agreement. If a patient cannot consent, a legal
representative consents for her.

## 13. Step 4: treatment and tracking

**Purpose:** Show that care happens close to home and outcomes are measured.

**On screen**

- Eyebrow: STEP 4 · TREATMENT AND TRACKING
- Title: Care close to home, with outcomes measured
- What her clinic records: 1 Her treatment and dose. 2 Her starting condition. 3 Better, same,
  worse, stopped or died, on a set schedule. 4 Side effects. 5 A coded ID, not her name.
- OPTIONAL · Easier tracking: Phone check-ins. Wearables. AI calls or texts.
- No required app or vendor. Normal medical records count.

**Visual:** Left, a white card with the numbered list. Right, a lavender card with a phone icon
showing a small bar chart, the optional tools as bullets, and the bold footer line.

**Speaker notes:** The required outcome record is short and can come straight from ordinary
medical records, with no duplicate entry. Tools like a tracking app, wearable integration and AI
check-ins are optional extras that can make tracking easier and richer.

**Video narration** (covers slides 13 and 14): Her first dose is in week two, at a clinic near
home. Memory tests and quick phone check-ins track how she's doing. Any serious side effect reaches
the board within days, and it can pause new patients. (Existing v3 audio.)

## 14. Safety net

**Purpose:** Answer "what happens if something goes wrong?"

**On screen**

- Eyebrow: SAFETY NET
- Title: If something goes wrong, the system reacts
- 1 Serious side effect: Reported to the board within days.
- 2 Board reassesses: Also if a trial elsewhere stops for safety.
- 3 New patients paused: Until a serious safety problem is resolved.
- 4 Current patients protected: They can continue if stopping is riskier.
- Every protocol is also reviewed at least once a year.

**Visual:** Four numbered step cards in a row joined by orange arrows, each with a small orange
icon. Below, a full-width dark navy banner with a clock icon holding the last line.

**Speaker notes:** Serious side effects go to the review board within days. The board must
reassess if a trial of the same treatment elsewhere stops for safety or lack of effect, and an
unresolved serious safety finding immediately stops treatment of new patients. Current patients
may continue if stopping suddenly is more dangerous.

## 15. Step 5: results go public

**Purpose:** Show that every result, good or bad, is published.

**On screen**

- Eyebrow: STEP 5 · RESULTS GO PUBLIC
- Title: Every result is published
- EXAMPLE ANNUAL BOARD REPORT · 48 PATIENTS: Improved 21 · 44%. No real change 14 · 29%.
  Worsened 6 · 13%. Stopped 4 · 8%. Died 0 · 0%. Lost to follow-up 3 · 6%. Serious side effects
  2 · 4%.
- Nothing hidden: Bad and unclear results must be published too.
- Privacy first: Small groups are combined so no one can be identified.

**Visual:** Left, a white report card with a horizontal bar per outcome (purple for improved and
no change, orange and brown for worsened, stopped and serious side effects, grey for lost to
follow-up). Right, two small cards with round icons.

**Speaker notes:** Each review board publishes a de-identified annual report for each protocol:
how many improved, had no real change, worsened, stopped, died, had side effects, or were lost to
follow-up. Boards may not omit bad, null or unclear results. The numbers here are made up to show
the format.

**Video narration** (covers slides 15 and 16): At six months her outcome is recorded, good, bad or
no change, then de-identified and published. Nothing is hidden. Pooled with every other clinic, it
updates the label. The next patient starts with better data than Margaret had. (Existing v3
audio.)

## 16. Step 6: from reports to labels

**Purpose:** Show how one result becomes shared evidence.

**On screen**

- Eyebrow: STEP 6 · RANKINGS AND LABELS IMPROVE
- Title: How one result becomes shared evidence
- Her clinic: Data stays with her doctor → Outcome report: Coded and de-identified → Board report:
  Yearly public results → Evidence system: Combines all clinics → Rankings and Outcome labels:
  Compare benefits and harms
- Her result improves the next patient's decision
- Every clinic reports in one open format, so any evidence system can combine the results.

**Visual:** Five boxes in a row joined by purple arrows; the last is filled purple with an orange
star. An orange dashed arrow loops from the last box back to the first, labeled with the
"next patient" line.

**Speaker notes:** This is how one patient's result becomes shared evidence. Each clinic files
standardized, de-identified outcome reports in an open format. Evidence systems pool the reports
across all clinics and publish outcome labels and treatment rankings, which the next patient uses
at step 1.

## 17. Margaret's first year

**Purpose:** Put the journey on one timeline.

**On screen**

- Eyebrow: MARGARET'S FIRST YEAR
- Title: One patient's path, start to finish
- Week 0 Explores: Compares labels; video visit with her doctor.
- Week 1 Consents: Signs the form; a charity helps pay.
- Week 2 First dose: At a clinic near home.
- Months 1-6 Tracked: Memory tests and phone check-ins.
- Month 6 Recorded: Coded outcome filed, good or bad.
- Year 1 Label updated: Her result joins the evidence.
- Margaret got treatment through her own doctor, and the next patient learns from her.

**Visual:** A horizontal timeline with six icon stops; the line runs purple, then orange into the
final orange star stop. Below, Margaret's small avatar beside the closing line in italics.

**Speaker notes:** Putting it together on one timeline. The key idea: the outcome is reported
whether it's good, bad, or neutral, so the evidence base reflects reality.

## 18. What the act does

**Purpose:** For legislators, what changes in law, on one slide.

**On screen**

- Eyebrow: THE CARE-INTEGRATED CLINICAL TRIALS ACT
- Title: What the act does
- Review: An independent board approves each treatment, clinic and consent form.
- Access: A treating doctor's recommendation and written consent are all a patient needs.
- Payment: Clinics may charge a fair price. No insurer or state program has to pay.
- Safety: Serious side effects reach the board within days, and it can pause new patients.
- Results: Every outcome is reported in one open format and published, de-identified.

**Visual:** A single white card with five rows, each a small purple icon, a bold lead-in and one
sentence.

**Speaker notes:** Each line sums up a provision shown earlier in the deck. Check every line
against the current bill text before presenting, and name the bill and the state on the slide.

If asked who pays: no insurer or state program is required to. The patient, family, charities,
employers, research sponsors, and insurers that choose to can pay. Clinics can charge a fair price,
so they have a reason to offer new treatments, and one board approval can cover many clinics. Under
federal Right to Try, by contrast, the drug maker may charge only its direct costs (21 CFR
312.8(d)(1)), so almost nobody offers drugs. Expect the concern that charging patients for
experimental treatment invites exploitation, as with unproven stem-cell clinics. The safeguards:
the board approves each clinic and protocol; the consent form states the cost and that the
treatment is experimental; serious side effects can pause new patients; and every result,
including failures, is published, so a clinic cannot hide poor results. If asked about liability:
federal Right to Try already protects makers and doctors from lawsuits, except for gross
negligence or willful misconduct, so the main barrier is money, not liability. Other payment
options: installments or memberships, crowdfunding, patient-aid groups, free supply from the
maker, and lower prices for patients who share outcome data.

## 19. Close

**Purpose:** Restate the three changes and give one action.

**On screen**

- Headline: Every patient's experience becomes evidence for the next.
- **Any patient can get** the most promising treatments through their own doctor.
- **Clinics can charge fairly,** so they offer treatments nobody else will fund.
- **Every result is published,** producing treatment rankings and outcome labels.
- Ask: Patients, families, doctors and clinics: register your interest at acceleratedmedicine.org

**Visual:** Dark, with the patient path across the top. A large white headline; three lines below
it with bold lead-ins and the icons from slide 6. At the bottom, an amber-outlined panel with the
ask and the web address.

**Speaker notes:** Close on the three changes. Then the ask: patients, families, doctors and
clinics can register their interest at acceleratedmedicine.org. Registrations show legislators and
clinics how many people want this. For a hands-on look, the prototype shows treatment rankings and
outcome labels.

**Video narration:** Any patient can get treatment through their own doctor. Clinics can afford to
offer it. Every result is published, and the next patient learns from Margaret. If you're a
patient, a family member, a doctor or a clinic, register your interest at acceleratedmedicine.org.

---

# Backup slides

For questions about scale and cost. Not in the main story or the video.

## B1. The untested frontier

**Purpose:** Answer "how much is left untested?"

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: We have tested 0.34% of what we already have
- 9,500 compounds with a human safety record × 1,000 diseases = 9.5 million possible drug-disease
  pairs
- Legend: Tested: about 32,500 pairs (0.34%). Never tested: about 9.47 million. Over 2,000 years
  at today's pace.
- Card: Most pairs will not work. If only 1 in 1,000 works, that is about 9,500 treatments nobody
  is looking for.
- Card: What care-integrated trials change. Doctors can already use approved drugs off-label, but
  nobody tracks the results. Care-integrated trials add drugs still in testing and track every
  outcome.

**Visual:** The equation in large purple numerals across the top. Below, a wide grid of 300 small
beige squares with a single purple square (the tested part). A legend with an orange clock icon,
then two white cards.

**Speaker notes:** About 9,500 compounds (range 7,000 to 12,000) already have a human safety
record: approved drug ingredients, investigational compounds that passed Phase I, and GRAS
substances. The roughly 14,000 ICD-10 diagnosis codes group into about 1,000 diseases that trials
can target. 9,500 times 1,000 gives about 9.5 million possible drug-disease pairs. Only about
32,500 pairs have ever been tested (range 15,000 to 50,000), which is 0.34%. Each square in the
grid is about 31,700 pairs, so one square of 300 is the whole tested part. At about 3,300 to 4,400
completed trials a year, testing every pair one trial at a time would take 2,000 to 2,900 years.
Expect the objection that most pairs make no sense. That is true, and it does not matter: if only
1 in 1,000 pairs works, that is about 9,500 treatments that nobody is testing. Most of these
compounds are off patent, so no company has a reason to pay for the tests. Expect the objection
that doctors can already prescribe approved drugs off-label. That is true, but nobody tracks what
happens, so nobody learns which uses work. Care-integrated trials do two things here: they let
patients get compounds that passed Phase I but are not yet approved, and they record the outcome of
every treatment so the evidence builds. Source:
https://manual.warondisease.org/knowledge/problem/untapped-therapeutic-frontier.html

**Source line:** Source: How to End War and Disease, "The Untapped Therapeutic Frontier" (FDA, GRAS,
ICD-10 and ClinicalTrials.gov data).

## B2. When every disease could have a first treatment

**Purpose:** Answer "what would this do at scale?" without overstating it.

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: When will every untreated disease have a first treatment?
- 6,650 diseases have no treatment today. At today's pace, the last of them gets its first
  treatment in about 443 years. With the system, in about 36.
- At today's pace (15 diseases a year): 443 years
- With the system (about 185 diseases a year): 36 years
- 12× more patients in trials: 1.9 million to 23 million a year
- 44× lower cost per patient: $41,000 to under $1,000
- 8 years less waiting after safety tests: available after board review

**Visual:** Two horizontal bars: a long grey bar for 443 years and a short purple bar for 36
years. Three white stat cards beneath, each with a large purple figure.

**Speaker notes:** What the numbers mean: 443 years is when the last untreated disease would get
its first treatment at today's pace. It is not when diseases get cured, and most would get a first
treatment much sooner. About 6,650 diseases have no approved treatment. Today about 15 diseases get
their first treatment each year, so the last one would get it about 443 years from now. Today about
1.9 million people join a clinical trial each year worldwide (IQVIA). About 2.4 billion people have
a chronic disease, and about 44.8% say they would join a trial, about 1.08 billion people. If only
23 million join each year, about 2%, research capacity rises about 12 times, to about 185 diseases
a year, and the backlog clears in about 36 years. Cost: a traditional Phase III trial costs about
$41,000 per patient; embedded pragmatic trials such as RECOVERY (about $500) and ADAPTABLE (about
$929) cost under $1,000, about 44 times less. Waiting: today a treatment that passes Phase I safety
testing waits about 8.2 years for efficacy proof; here, patients can choose it after independent
board review. Key assumption: discoveries rise in proportion to the number of patients studied;
the impact paper states and tests this. Source:
https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper.html

**Source line:** Assumes 2% of willing patients join and discoveries rise with patients studied.
Source: How to End War and Disease, impact paper.

## B3. Value for money

**Purpose:** Answer "is it worth the cost?"

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: A year of healthy life for under $10
- Cost per year of healthy life: $9.50 (Care-integrated trials; at scale, in everyday care). $89
  (Malaria bed nets; one of the best charities known). $100,000+ (A typical new drug; at the usual
  U.S. price limit).
- Bar strip: Care-integrated trials, $9.50: too small to see at this scale. Malaria bed nets,
  $89: about 1 pixel wide. A typical new drug, $100,000+.
- About 9 times cheaper than bed nets. Over 10,000 times cheaper than a typical new drug.

**Visual:** Three cards: a purple-filled "$9.50" card, then "$89" in orange and "$100,000+" in
navy on white. Beneath, a to-scale bar strip in which only the drug's dark bar is visible.

**Speaker notes:** This is the standard cost-effectiveness test every new drug must pass: what it
costs to gain one year of healthy life (one disability-adjusted life year, or DALY: a year without
early death or disability). Lower is better. The bar strip is drawn to scale: if the drug bar is
1,220 pixels, bed nets are about 1 pixel and care-integrated trials about one tenth of a pixel,
so the empty space is the point. Care-integrated trials at scale, meaning pragmatic trials built
into everyday care: about $9.50 per healthy year. The cost counts the full research cost of the
trials, whoever pays: about 23.4 million patients a year at about $929 each, for the 36 years it
takes to give every untreated disease a first treatment. The benefit is the healthy years gained
because treatments arrive sooner (How to End War and Disease, impact paper). Both costs and health are
discounted at the standard 3% a year. If asked: with no discounting at all, it is about $1.39 per
healthy year. The impact paper's headline of $0.84 discounts costs but not health, so we do not
lead with it. Malaria bed nets: about $89 per healthy year (How to End War and Disease). That
is about 9 times more than $9.50. A typical new drug: the usual U.S. limit is $100,000 to $150,000
per quality-adjusted life year (Institute for Clinical and Economic Review). $100,000 divided by
$9.50 is about 10,500, so over 10,000 times more. Even if only half of disease deaths can ever be
avoided (the manual's low estimate), the cost is still about $17.50 per healthy year. Source:
https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper.html

**Source line:** A year of healthy life = one year without early death or disability.
Conservative: costs and health both discounted 3% a year. Sources: How to End War and Disease, impact
paper; ICER.

---

# Video cut

About 2:30, calm, narrated, captioned, no music. The video opens on Margaret and uses these slides
in order: 2, 4, 5, 6 (with the patient path from slide 7), 8, 10, 11 and 12, 13 and 14, 15 and
16, and 19, ending on an acceleratedmedicine.org end card. The narration is under each slide.
Lines marked "existing v3 audio" can reuse the v3 recordings; the other six need new narration
(about 1.8 minutes).
