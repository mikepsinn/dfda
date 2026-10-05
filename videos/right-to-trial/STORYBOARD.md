---
format: 1920x1080
duration: 130s
message: "Care-integrated clinical trials let any patient get promising treatments through their own doctor, and every result is published so the next patient chooses better."
arc: story-explainer with how-to
audience: General public, patients and families, policymakers and funders
mode: autonomous
music: none
---

## Video direction

- **Palette (from frame.md, by role):** `bg` warm cream ground on every frame except Frame 4; `primary` purple carries every accent — numerals, bars, active path dot, highlight rings, the cursor ripple; `text` near-black for headlines; `text-muted` slate for body and labels; `text-light` for sources and dimmed/"blocked" states; tinted cards (`card-bg` fill, `border` 1.5px, 14px radius, no shadow). `night` is the ground of Frames 4 and 10 only (the idea, the close). `highlight` orange appears only on the last path dot (the star).
- **Type:** Inter throughout via frame.md roles. Numerals are the heroes on data frames (`stat-num` / `metric-value`, purple, tabular). Headlines near-black, −0.02em. Eyebrows purple uppercase.
- **Recurring motif — the patient path:** six purple circles on a dashed wavy line, icons in order: search (explore), chat (doctor), book (consent and cost), line-chart (treatment & tracking), bar-chart (results), star in `highlight` orange (rankings improve). Frame 4 draws it full-size; Frames 5–9 carry a small version in the top-left eyebrow with the current step's dot active (filled purple) and the rest at 30% opacity: step 1 (Frames 5–6), steps 2–3 (Frame 7), step 4 (Frame 8), steps 5–6 (Frame 9). Frame 10 may draw it full-size again with every dot lit. Same geometry every time.
- **Disclosures (always legible, never decorative):** Frame 5 carries a "Prototype" pill on the browser window for the whole frame. Illustrative numbers carry "Example". Data frames end with a one-line source in `text-light`.
- **Motion grammar:** smooth long-tail settles (`power3`; `expo.out` only on fast arrivals); no bounce, no overshoot. Every element enters on its spoken cue from the word timings; nothing appears before the voiceover names it. Count-ups use the value-scaled counter. Holds are still; subtle jitter is the only allowed aliveness. No looping, no breathing, no back-half drift. Frame 5 is the one frame with a camera tour, and every camera move there is cued to a phrase.
- **Rhythm / held beats:** Frame 1's last line ("If she takes one, nobody records what happens.") lands and holds still. Frame 4 is the breather/turn: dark, slower, one draw-on move. Frame 10 resolves and holds as the ending.
- **Caption band:** captions are on; keep all primary content in the top ~83%. Centered heroes anchor around y ≈ 454.
- **Negative list:** no stock photos, no bokeh or purple-blue "AI" gradients, no drop shadows on content (the browser window lifts with a border and a tinted backdrop, not a shadow), no invented numbers (every figure is in this storyboard or on the captured pages), no bouncy entrances, no front-loaded-then-frozen slides, no screensaver floating.

## Frame 1 — Meet Margaret

- scene: Margaret's portrait settles in; a counter runs to 573 candidate drugs; the field greys out, leaving a few, and two lines state the problem
- voiceover: "Margaret is 68 and has Alzheimer's. Researchers have identified 573 existing drugs that might help her. Few have ever been tested for Alzheimer's, so her doctor has no evidence to recommend any of them. And if she takes one anyway, nobody records what happens."
- duration: 15.987s
- transition_in: cut
- status: animated
- src: compositions/frames/01-meet-margaret.html
- type: hook

narrativeRole: Puts a human face on the problem: help may exist, but nobody has tested it or records what happens.
keyMessage: Hundreds of existing drugs might help Margaret, but few have been tested, so her doctor has no evidence and nobody learns from her.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: portrait, then "Margaret, 68" on "68"; the "Alzheimer's disease" tag on "Alzheimer's"; on "identified" the dot field opens and on "573" the counter counts up with "existing drugs that might help her"; on "Few" the dots grey out in a wave, leaving eight scattered purple ones, and the line "Few have ever been tested for Alzheimer's." appears below the card; on "no evidence" the line "Her doctor has no evidence for any of them."; on "nobody records" the line "If she takes one, nobody records what happens." with a blank clipboard drawn beside it. Hold. Source: Frontiers in Pharmacology, 2023.

## Frame 2 — Three reasons

- scene: Three cards build left to right, one per reason: a struck-through "Patent" · 99.8% · 21
- voiceover: "There are three reasons. Old drugs can't be patented, so no company pays to test them. Almost no Alzheimer's patients are in any study, so nobody learns from their treatment. And the federal Right to Try law lets drug makers charge only their costs, so they have no reason to take part: only 21 drugs have been made available in over six years."
- duration: 19.931s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-three-locks.html
- type: pain_point

narrativeRole: Explains why promising drugs go untested: three separate failures, each with its own number.
keyMessage: No one pays to test old drugs, no one learns from patients, and Right to Try gives makers no reason to take part.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: heading on "three reasons"; eyebrow "Why she's stuck" and the heading "Three reasons promising drugs go untested"; card 1 "No one pays to test old drugs" on "Old", with "Patent" struck through on "patented" and a slash across a coin on "pays"; card 2 "No one learns from patients" with 99.8% on "Almost no Alzheimer's patients"; card 3 "Right to Try gives makers no incentive" on "Right", with the pill "Price capped at cost" on "charge" and a slash across a price tag on "no reason", counting to 21 ("drugs made available in over six years") on "21". Sources: Frontiers in Pharmacology, 2023; USC Schaeffer Center; Alzheimer's Association, 2026; FDA via FactCheck.org, 2026.

## Frame 3 — Proof: RECOVERY

- scene: A trial inside ordinary hospital care: 89 days to an answer, a cheap steroid, deaths cut by up to a third, about a million lives saved
- voiceover: "It doesn't have to be this way. In 2020, Britain built a clinical trial into ordinary hospital care. In under three months, it showed that dexamethasone, a cheap steroid used for decades, cut deaths among the sickest COVID patients by up to a third. It saved about a million lives."
- duration: 17.816s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-recovery.html
- type: proof

narrativeRole: Shows that a trial built into everyday care already worked, quickly and cheaply.
keyMessage: RECOVERY found a life-saving treatment in under three months by running inside ordinary hospital care.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: eyebrow "PROOF PRAGMATIC TRIALS WORK" and the headline "A trial built into everyday care"; a hospital icon with patients joining during normal care on "built a clinical trial into ordinary hospital care"; a day counter to 89 ("days to an answer") on "In under three months"; the chip "Dexamethasone · a cheap steroid, used for decades"; bars for usual care and dexamethasone ("deaths among patients on ventilators", shrinking to two thirds) on "up to a third"; "1 million" ("lives saved worldwide (estimate)") on "a million lives". Sources: RECOVERY Collaborative Group, New England Journal of Medicine, 2021; NHS England, 2021.

## Frame 4 — The idea

- scene: Dark breather: the title, then the six-step patient path draws on
- voiceover: "Care-integrated clinical trials would do the same for every disease, in everyday care. Here's Margaret's year."
- duration: 6.87s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/04-the-fix.html
- type: turn

narrativeRole: The turn from problem to proposal, and the map of Margaret's year.
keyMessage: Care-integrated clinical trials bring the same idea to every disease, in everyday care.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: "Care-integrated clinical trials" on its words; "The same idea, for every disease, in everyday care" on "do the same"; the six-step patient path draws on; "Here's Margaret's year." on "Here's".

## Frame 5 — Step 1: compare options

- scene: A floating browser window shows the prototype's Alzheimer's rankings; a cursor clicks Lecanemab's outcome label and the camera tours its scores, side effects and cost
- voiceover: "She starts by comparing her options: treatments ranked side by side, each with an outcome label showing who improved, the side effects, the cost and how strong the evidence is."
- duration: 11.345s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/05-compare-options.html
- type: feature_showcase
- persuasion: Demonstration (show the real prototype working) + progressive disclosure
- beat: Comprehension + agency
- blueprint: device-surface-showcase
- asset_candidates: public/app/rankings-alzheimers.png — real prototype rankings page (six Alzheimer's treatments); public/app/label-lecanemab.png — real prototype Lecanemab outcome label

narrativeRole: First step of the journey, shown on the real product so the idea feels concrete and buildable.
keyMessage: Patients can compare treatments by benefit, side effects, cost and evidence before choosing.

Eyebrow "STEP 1 · EXPLORE OPTIONS" with the seven-dot path, dot 1 active. Persistent tag on the footage: "Prototype · model estimates". Zoom targets are given in BRIEF.md ## Assets.

- focal: the floating browser window showing the real prototype pages
- roles: browser window (rounded, 1.5px border, minimal title bar with a url pill reading "Open Treatment Evidence Network") holding the two captured pages = foreground subject, ~72% width, right-leaning · eyebrow + mini path + short h3 "Compare every option" = supporting, top-left · "Prototype · model estimates" pill = chrome on the window · custom cursor with click ripple = supporting · purple highlight rings on the parts the VO names = supporting
- sfx: none

Adapt (device-surface-showcase, floating-window push-scroll): keep the held floating window whose screens advance through a real flow; the operation is a scroll, a cursor click into the outcome label, then a camera tour (zoom-to-target) across the label's regions, each cued to a phrase. Image coordinates: both PNGs are 2x captures of a 1440-px-wide page, so CSS-px positions in BRIEF.md ## Assets double in the image.
Scene 1 (0.0–2.6s): cream ground. Eyebrow, mini path (dot 1 active) and h3 reveal top-left; the window rises in flat (fade + rise, power3; no tilt) showing the top of the rankings page ("Treatment rankings" header, condition = Alzheimer's Disease).
Scene 2 (2.6–4.9s): on "treatments ranked" (2.6s) the page scrolls inside the window to the ranking cards (CSS y ≈ 560–1030) so Donanemab #1 and Lecanemab #2 sit side by side; on "side by side" (3.3s) a purple highlight ring draws around the pair (`css-marker-patterns`, outline).
Scene 3 (4.9–6.3s): on "each with an outcome label" (4.9–5.6s) the cursor glides to Lecanemab's "View Outcome Label" button (CSS ≈ x 760–1220, y 965–1000) and clicks with a ripple (`cursor-click-ripple`); the window content swaps to the Lecanemab label page top (CSS y 0–700: title, "For Alzheimer's Disease", effectiveness 55 / safety 50 score card) via a short push-up.
Scene 4 (6.3–9.4s): on "who improved" (6.7s) the camera zooms to the outcome-estimates list (CSS ≈ x 208–818, y 790–1100, the +27% / +26% / +37% rows) and rings them (`coordinate-target-zoom`); on "the side effects" (8.0s) it moves to the side-effect estimates (CSS ≈ y 1440–1610: infusion reactions 26%, ARIA-E 13%, ARIA-H 17%, headache 13%) and rings them.
Scene 5 (9.4–12.0s): on "the cost" (9.5s) the camera moves to the cost card (CSS ≈ x 850–1232, y 725–1080, "$36,500 / year") and rings it; on "how strong the evidence is" (10.2–11.4s) it pulls back to the "Current best estimates · Preliminary estimates, updated as better evidence becomes available" banner (CSS ≈ y 460–495) and rings it. Hold still to the end.

## Frame 6 — Screened first

- scene: Three reviewer badges (physician, outcomes researcher, ethicist) assemble around a shield; a pill reads "No financial ties to the clinic or maker"
- voiceover: "An independent board has already screened every option."
- duration: 5.179s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-screened-first.html
- type: benefit_highlight
- persuasion: Rule of three (who reviews) + reassurance by structure
- beat: Trust + reassurance
- blueprint: grid-card-assemble

narrativeRole: Answers the safety worry immediately after showing choice: options are pre-screened before anyone can pick them.
keyMessage: Every option on the list was reviewed by an independent physician, researcher and ethicist with no conflicts.

Card copy (from the deck): "Who reviews: a physician, an outcomes researcher and an ethicist" · "No financial ties to the clinic or maker" · "Flat fees, never paid per approval". Board name: Experimental Treatment Review Board (ETRB).

- focal: the shield with a check at the center of three reviewer badges
- roles: eyebrow + mini path (dot 1 active) + h2 "Every option is screened first" = supporting, top · central shield-check = hero, centered · three reviewer cards (Physician / Outcomes researcher / Ethicist, each with a simple line icon) = foreground triptych around it · two pills "No financial ties to the clinic or maker" and "Flat fees, never paid per approval" = supporting, beneath · board name line "Experimental Treatment Review Board (ETRB)" = chrome
- sfx: none

Adapt (grid-card-assemble): keep the staggered cascade into a held array; the array is three reviewer cards around a central mark, closed by payoff pills.
Scene 1 (0.0–1.8s): cream ground. Eyebrow + mini path reveal; on "independent board" (0.2–0.8s) the shield outline draws itself at center (`svg-path-draw`) with the board name beneath it; h2 reveals at ~1.0s.
Scene 2 (1.8–3.2s): on "screened every option" (1.9–2.8s) the three reviewer cards assemble around the shield in a left-to-right stagger and the check mark draws inside the shield on "option" (2.8s).
Scene 3 (after "every option"): right after the line ends (3.9–4.7s) the pill "No financial ties to the clinic or maker" reveals beneath, then "Flat fees, never paid per approval" at ~5.3s. Hold still — the first cut ends here.

## Frame 7 — Doctor, consent and cost

- scene: A video visit with her doctor, a plain-language consent form, then a charity helping her pay
- voiceover: "Her own doctor recommends one over a video visit, and she signs a plain-language consent: the risks, the unknowns, who pays, and that it's experimental. A charity helps her pay, and no insurer or state program has to."
- duration: 14.341s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/07-doctor-consent.html
- type: how_to

narrativeRole: Shows how simple access is, and that she decides with the risks and the cost in front of her.
keyMessage: Her own doctor recommends it; she consents in writing knowing the risks and who pays; no insurer or state program has to.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: the video visit, the heading "Her doctor's recommendation" and the pill "Telemedicine is fine" on "doctor recommends one over a video visit"; on "signs" the heading becomes "Her written consent" and the consent form fills in, ticking "Known risks", "What's unknown", "Who pays" and "Clearly experimental" on their words; then the heading "Help with the cost", a bill card "Margaret's treatment" with the chip "A charity helps her pay" on "charity", and "No insurer or state program has to pay" on "no insurer". The mini path highlights step 2, then step 3.

## Frame 8 — Treatment and safety

- scene: The app's daily-tracking mock-up (memory score, dose check-offs) with a "Week 2 · first dose" chip; then a four-step safety chain: serious side effect → board reassesses → new patients paused → careful continuation
- voiceover: "Her first dose is in week two, at a clinic near home. Memory tests and quick phone check-ins track how she's doing. Any serious side effect reaches the board within days, and it can pause new patients."
- duration: 12.516s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/09-treatment-safety.html
- type: feature_showcase
- persuasion: Demonstration (the real tracking screen) + causal chain (safety net)
- beat: Reassurance
- blueprint: device-surface-showcase
- asset_candidates: public/app/tracking-mockup.png — the web app's daily-tracking mock-up from the home page "How it works" section

narrativeRole: Step 5: care close to home, outcomes measured, and a safety net that reacts.
keyMessage: Treatment happens near home with simple tracking, and the board can pause new patients if something goes wrong.

Safety-chain copy (from the deck): "Serious side effect: reported within days" → "Board reassesses" → "New patients paused" → "Current patients may continue if safer".

- focal: the app's daily-tracking screen inside a phone frame, then the safety chain
- roles: eyebrow "STEP 5 · TREATMENT AND TRACKING" + mini path (dot 5 active) = chrome · chips "Week 2 · first dose" and "Clinic near home" = supporting · phone frame holding public/app/tracking-mockup.png (the web app's tracking mock-up, 896×814 px capture at 2x) = foreground subject, left ~40% · four-step safety chain = supporting, right column
- sfx: none

Adapt (device-surface-showcase): keep a held device surface showing a real screen; the surface is operated by a highlight and a notification, then the frame hands off to the safety chain beside it.
Scene 1 (0.0–3.6s): cream ground. Eyebrow and mini path reveal; chip "Week 2 · first dose" pops on "first dose" (0.51–0.81s); chip "Clinic near home" with a pin icon on "clinic near home" (2.30s).
Scene 2 (3.6–7.0s): the phone rises in on the left on "Memory tests" (3.75s) showing the tracking mock-up; a purple ring highlights the "Cognitive Function" score row on "tests" (4.14s); on "phone check-ins" (4.99s) a small notification bubble "Daily check-in done" slides down over the phone's top edge.
Scene 3 (7.0–12.5s): on the right, a vertical four-step safety chain builds, one row per cue, connected by a thin line: "Serious side effect · reported within days" (7.17s, warning icon, `negative` tint), "Board reassesses" (9.13s), "New patients paused" (10.67s, pause icon), "Current patients may continue if safer" (11.18s). Hold.

## Frame 9 — Results and the loop

- scene: An example board report's bars grow (improved / no change / worse / stopped / lost); "Nothing hidden" stamps on; the results flow into the outcome label, and an orange arrow loops back to step 1 for the next patient
- voiceover: "At six months her outcome is recorded, good, bad or no change, then de-identified and published. Nothing is hidden. Pooled with every other clinic, it updates the label. The next patient starts with better data than Margaret had."
- duration: 14.602s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/10-results-loop.html
- type: benefit_highlight
- persuasion: Causal chain (one result → public report → label → next patient) + callback to the patient path
- beat: Satisfaction + meaning
- blueprint: compose
- asset_candidates: public/app/label-lecanemab.png — real prototype Lecanemab outcome label, for the "updates the label" beat

narrativeRole: Steps 6–7: every outcome, good or bad, becomes public evidence that improves the next patient's choice.
keyMessage: Every result is published and pooled into the label, so the next patient starts with better data.

Report copy (from the deck, labeled "Example annual board report · 48 patients"): Improved 21 · 44%; No real change 14 · 29%; Worsened 6 · 13%; Stopped 4 · 8%; Lost to follow-up 3 · 6%. Illustrative: must carry the "Example" tag.

- focal: the example board report's outcome bars, then the loop back to step 1
- roles: eyebrow "STEPS 6–7 · RESULTS GO PUBLIC" + mini path (dots 6–7 active) = chrome · "Margaret · month 6 · outcome recorded" chip = supporting · example board report card with five bars = hero, left ~55% · "Example report · 48 patients" tag = chrome on the card · "Nothing hidden" stamp = foreground emphasis · a crop of public/app/label-lecanemab.png (2880×3748 px, 2x capture; crop to CSS-px y 180–700, the title and score card) as the outcome label = supporting, right · orange dashed loop arrow = supporting
- sfx: none

Compose: a bar report that builds on its spoken words, a stamp, a flow into the label, and a loop arrow back to the start.
Scene 1 (0.0–2.6s): cream ground. Eyebrow and mini path reveal; the chip "Margaret · month 6 · outcome recorded" pops on "six months" (0.47s).
Scene 2 (2.6–6.6s): the report card appears with its "Example report · 48 patients" tag; bars grow on their words (`stat-bars-and-fills`): "Improved 44%" on "good" (2.65s), "Worsened 13%" on "bad" (3.07s), "No real change 29%" on "no change" (3.54s), then "Stopped 8%" and "Lost to follow-up 6%" (~4.0s). On "de-identified" (4.82s) a small "De-identified" chip with an ID-hidden icon; on "published" (5.80s) a "Public registry" chip.
Scene 3 (6.6–8.0s): on "Nothing is hidden" (6.70s) a stamp "Nothing hidden" lands across the report's top-right corner with a single smooth scale settle.
Scene 4 (8.0–11.1s): on "Pooled with every other clinic" (7.98s) small dots stream from the report into the outcome-label crop on the right; on "updates the label" (9.73s) the label gains an "Updated" chip.
Scene 5 (11.1–14.6s): on "The next patient" (11.26s) an orange dashed arrow draws from the label back up to the mini path's first dot (`svg-path-draw`), and a new generic avatar silhouette appears at step 1. Hold.

## Frame 10 — Close

- scene: The three changes, the next patient, and the end card
- voiceover: "Any patient can get treatment through their own doctor. Clinics can afford to offer it. Every result is published, and the next patient learns from Margaret. Learn more at acceleratedmedicine.org."
- duration: 11.546s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/12-close.html
- type: close

narrativeRole: Restates the three changes and says where to learn more.
keyMessage: Any patient can get treatment through their own doctor, clinics can afford to offer it, and every result is published.

Built against estimated narration timings (timing/v4-estimated.json); re-time with tools/retime-to-narration.py once the line is recorded.

Beats: the six-step path draws on under the title "Care-Integrated Clinical Trials"; "Any patient can get treatment through their own doctor.", "Clinics can afford to offer it.", "Every result is published." and "The next patient learns from Margaret." each on their words, with Margaret, an arrow and the next patient beside the last line; the end card "Learn more at acceleratedmedicine.org" on "Learn more", with the rest dimmed, held to the end.
