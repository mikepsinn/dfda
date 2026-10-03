---
format: 1920x1080
duration: 144s
message: "Care-integrated clinical trials let patients who aren't dying get promising treatments through their own doctor, and every result is published so the next patient chooses better."
arc: story-explainer with how-to
audience: General public, patients and families, policymakers and funders
mode: autonomous
music: none
---

## Video direction

- **Palette (from frame.md, by role):** `bg` warm cream ground on every frame except Frame 4; `primary` purple carries every accent — numerals, bars, active path dot, highlight rings, the cursor ripple; `text` near-black for headlines; `text-muted` slate for body and labels; `text-light` for sources and dimmed/"blocked" states; tinted cards (`card-bg` fill, `border` 1.5px, 14px radius, no shadow). `night` is the ground of Frames 4 and 12 only (the fix, the close). `highlight` orange appears only on the seventh path dot (the star).
- **Type:** Inter throughout via frame.md roles. Numerals are the heroes on data frames (`stat-num` / `metric-value`, purple, tabular). Headlines near-black, −0.02em. Eyebrows purple uppercase.
- **Recurring motif — the patient path:** seven purple circles on a dashed wavy line, icons in order: search (explore), chat (doctor), book (consent), shield (payment), line-chart (treatment & tracking), bar-chart (results), star in `highlight` orange (rankings improve). Frame 4 draws it full-size; Frames 5–10 carry a small version in the top-left eyebrow with the current step's dot active (filled purple) and the rest at 30% opacity: step 1 (Frames 5–6), steps 2–3 (Frame 7), step 4 (Frame 8), step 5 (Frame 9), steps 6–7 (Frame 10). Frame 12 draws it full-size again with every dot lit. Same geometry every time.
- **Disclosures (always legible, never decorative):** Frame 1 carries a small pill "Margaret is a composite patient" for the whole frame. Frame 5 carries a pill "Prototype · example estimates, not medical advice" on the browser window for the whole frame. Model figures (443, 36, 12×, $9.50) carry "Model estimate" with their source. Illustrative numbers carry "Example". Data frames end with a one-line source in `text-light`.
- **Motion grammar:** smooth long-tail settles (`power3`; `expo.out` only on fast arrivals); no bounce, no overshoot. Every element enters on its spoken cue from the word timings; nothing appears before the voiceover names it. Count-ups use the value-scaled counter. Holds are still; subtle jitter is the only allowed aliveness. No looping, no breathing, no back-half drift. Frame 5 is the one frame with a camera tour, and every camera move there is cued to a phrase.
- **Rhythm / held beats:** Frame 1's last line ("She can't get a single one.") lands and holds still. Frame 4 is the breather/turn: dark, slower, one draw-on move. Frame 12 resolves and holds as the ending.
- **Caption band:** captions are on; keep all primary content in the top ~83%. Centered heroes anchor around y ≈ 454.
- **Negative list:** no stock photos, no bokeh or purple-blue "AI" gradients, no drop shadows on content (the browser window lifts with a border and a tinted backdrop, not a shadow), no invented numbers (every figure is in this storyboard or on the captured pages), no bouncy entrances, no front-loaded-then-frozen slides, no screensaver floating.

## Frame 1 — Meet Margaret

- scene: Margaret's portrait pops in; a counter runs to 573 candidate drugs, then a lock closes over them
- voiceover: "Margaret is 68 and has Alzheimer's. Researchers have flagged 573 existing drugs that might help her. She can't get a single one."
- duration: 9.568s
- transition_in: cut
- status: animated
- src: compositions/frames/01-meet-margaret.html
- type: hook
- persuasion: Concretization (one named person) + shocking statistic
- beat: Recognition + quiet outrage
- blueprint: dataviz-countup
- asset_candidates: public/margaret.png — the deck's flat illustration of Margaret, 68, grey hair, round glasses, purple top, on a lavender circle

narrativeRole: Puts a human face on the problem and opens the gap: help exists on paper, but not for her.
keyMessage: There are hundreds of possibly useful drugs for Margaret, and she can't get any of them.

Hook strategy: stakes / consequence through one person. Margaret is a composite, so a small persistent chip reads "Margaret is a composite patient." Source line for 573: Frontiers in Pharmacology, 2023.

- focal: the 573 counter with its field of 573 small dots
- roles: Margaret portrait (public/margaret.png) = foreground subject, left third · name + condition = supporting type beside her · 573 counter = hero numeral, right · dot field (573 dots, one per drug) = midground data-viz behind the counter · lock glyph = supporting, final beat · composite pill + source line = chrome
- sfx: none

Adapt (dataviz-countup, hook-counter-burst): keep the signature count-up where the number grows as it climbs; the "icons flung outward" become a grid of 573 small dots filling in index order as the count rises, and the resolution is a lock rather than a glow.
Scene 1 (0.0–1.7s): cream ground with a faint dot-grid texture. Margaret's portrait settles in at left-third (~38% frame height) on a smooth long-tail settle (fade + small rise, power3); "Margaret, 68" in `h1` near-black reveals beside her on "68" (0.7s) with the same settle. The pill "Margaret is a composite patient" fades up top-left with the portrait and stays. Rule-of-thirds, 3 layers (texture, portrait, type).
Scene 2 (1.7–3.3s): on "Alzheimer's" (1.76s) a tag-pill "Alzheimer's disease" reveals under her name. Hold; nothing else on the right yet.
Scene 3 (3.3–7.9s): on "flagged" (4.1s) the right half opens: on "573" (4.6s) a purple `stat-num` counter counts 0→573 and grows as it climbs (`counting-dynamic-scale`) while a 24-column field of 573 small purple dots fills in index order behind/below it (`stat-bars-and-fills`, deterministic stagger). On "existing drugs" (6.1s) the label "existing drugs that might help her" reveals under the number. Source line "Source: Frontiers in Pharmacology, 2023" fades in bottom-left above the caption band at ~7.5s. Asymmetric 40/60 split.
Scene 4 (7.9–10.1s): on "She can't get" (8.7s) every dot desaturates to `text-light` in one quick wave (index-ordered, fast) and a lock glyph draws itself over the counter (`svg-path-draw`), the number dimming to `text-light`; on "single one" (9.4s) the line "She can't get any of them." reveals in `h3` near-black beneath. Hold still to the end — the held silence is the beat.

## Frame 2 — Three locks

- scene: Three tinted cards build left to right, one per problem: 21 · 573 · 99.8%
- voiceover: "Federal right-to-try covers only the dying. From 2018 to 2024, just 21 drugs were used under it. Old drugs can't be patented, so nobody pays to test them. And almost no Alzheimer's patients are in any study, so nobody learns from what happens to them."
- duration: 17.506s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-three-locks.html
- type: pain_point
- persuasion: Rule of three + statistical proof
- beat: Tension + disbelief
- blueprint: grid-card-assemble

narrativeRole: Explains why Margaret is stuck: three separate failures, each with its own number.
keyMessage: The system blocks her three ways: you must be dying, nobody pays to test old drugs, and nobody records what happens to patients.

Card copy (from the deck): "You have to be dying" / 21 / "drugs used under federal right-to-try, 2018–2024". "No financial incentive" / 573 / "Alzheimer's candidates still untested. No patent, no sponsor." "No one publishes outcomes" / 99.8% / "of Alzheimer's patients are in no study". Sources line: FDA via FactCheck.org, 2026 · Frontiers in Pharmacology, 2023 · Alzheimer's Association, 2026.

- focal: the active card's purple numeral (21, then 573, then 99.8%)
- roles: slide-header (eyebrow "WHY SHE'S STUCK" + h2 "Three things block her") = supporting · three tinted cards in a triptych = foreground subjects, one active at a time · small icon per card (hourglass, coin with slash, empty clipboard) = supporting · sources line = chrome
- sfx: none

Adapt (grid-card-assemble): keep the staggered card assemble into a held array; slow it to one card per spoken problem, with the previous card de-emphasized while the next is active, and all three equal at the end.
Scene 1 (0.0–3.3s): cream ground. Eyebrow + h2 reveal top-left (0.0s). On "Federal right-to-try" card 1 rises into the left slot with its title "You have to be dying" (per-word reveal); the card's numeral slot is empty. Triptych, cards occupy ~80% width, top 83%.
Scene 2 (3.3–9.2s): on "2018" (3.4s) the card's small date line "2018–2024" reveals; on "21" (6.7s) the numeral counts 0→21 (`counting-dynamic-scale`) in purple `stat-num`; on "used under it" (7.8s) the description "drugs used under federal right-to-try, 2018–2024" reveals.
Scene 3 (9.2–13.6s): on "Old drugs" (9.2s) card 1 drops to ~55% opacity (`depth-of-field-blur`, light) and card 2 rises into the center slot with "No financial incentive"; on "patented" (10.4s) the numeral 573 counts up; on "nobody pays" (11.5s) its description reveals.
Scene 4 (13.6–19.6s): on "And almost no" (13.6s) card 2 de-emphasizes and card 3 rises right with "No one publishes outcomes"; on "Alzheimer's patients" (14.4s) the numeral counts to 99.8%; on "nobody learns" (17.3s) its description reveals; at ~18.5s cards 1 and 2 return to full opacity so all three read as one held array, and the sources line fades in. Hold still.

## Frame 3 — The untested 99.66%

- scene: 9,500 × 1,000 = 9.5 million builds as an equation, then a 300-square grid assembles and only one square lights purple
- voiceover: "About 9,500 compounds already have a human safety record. Paired with a thousand diseases, that's 9.5 million possible treatments. We've tested about a third of one percent."
- duration: 12.455s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-untested-gap.html
- type: social_proof
- persuasion: Worked example with real numbers + contrast (one lit square of 300)
- beat: Surprise + scale
- blueprint: grid-card-assemble

narrativeRole: Zooms out from Margaret to show the whole untested space, so the problem reads as systemic, not one bad case.
keyMessage: We already have 9.5 million possible drug–disease pairs with safety data, and have tested only 0.34% of them.

Legend (from the deck): "Tested: about 32,500 pairs (0.34%)" · "Never tested: about 9.47 million" · "Over 2,000 years at today's pace". Each square ≈ 31,700 pairs. Source: How to End War and Disease (FDA, GRAS, ICD-10 and ClinicalTrials.gov data).

- focal: the single lit purple square in a 300-square grid
- roles: equation strip (9,500 × 1,000 = 9.5 million) = foreground type, top · 60×5 grid of rounded squares = hero data-viz, middle band (~85% width) · legend row + "Over 2,000 years at today's pace" pill = supporting · source line = chrome
- sfx: none

Adapt (grid-card-assemble, self-populating board): keep the staggered assemble of many items into a held grid; the items are 300 small squares, and the payoff is contrast (one lit square) rather than a camera zoom-out.
Scene 1 (0.0–5.6s): cream ground. Full-width strip, top third: on "9,500" (0.3s) a purple `metric-value` counts 0→9,500 with label "compounds with a human safety record" revealing on "safety record" (3.9s). Only the first term is on screen.
Scene 2 (5.6–7.8s): on "Paired" (5.6s) a light purple "×" fades in, and on "thousand" (6.3s) "1,000" lands with label "diseases".
Scene 3 (7.8–11.4s): on "that's" (7.8s) "=" fades in and on "9.5 million" (8.0–9.2s) "9.5 million" lands with label "possible drug–disease pairs"; on "possible treatments" (9.5s) the 300-square grid assembles below in a fast left-to-right column cascade (index-ordered stagger), every square neutral `accent-light`.
Scene 4 (11.4–14.0s): on "tested" (11.7s) only the first square fills solid purple and a soft purple glow blooms behind it (`ambient-glow-bloom`, single bounded bloom); on "a third of one percent" (12.4–13.5s) the legend reveals left to right — "■ Tested: about 32,500 pairs (0.34%)" · "□ Never tested: about 9.47 million" — then the pill "Over 2,000 years at today's pace" with a clock icon, and the source line. Hold still.

## Frame 4 — The fix

- scene: Dark chapter card; the seven-dot patient path draws itself, the last dot an orange star; "Care-Integrated Clinical Trials" settles with "Treatment through your own doctor. Every result published."; Margaret settles onto step 1
- voiceover: "The fix is care-integrated clinical trials: treatment through your own doctor, and every result published. Here's Margaret's year."
- duration: 8.746s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/04-the-fix.html
- type: product_intro
- persuasion: Signposting (frame-then-fill: the seven-step path is the shape the rest fills)
- beat: Orientation + relief
- blueprint: logo-assemble-lockup
- asset_candidates: public/margaret.png — the deck's flat illustration of Margaret on a lavender circle

narrativeRole: The turn. Names the idea and its two promises, then shows the shape of the journey before walking it.
keyMessage: Care-integrated clinical trials mean treatment through your own doctor, with every result published.

- focal: the seven-dot patient path drawing itself, then the title lockup
- roles: `night` ground with a faint dot grid = background · dashed wavy path + seven icon circles (search, chat, book, shield, line-chart, bar-chart, star in `highlight`) = hero, upper half, ~85% width · "Care-Integrated Clinical Trials" `h1` in cream = foreground type, lower-left · two promise lines = supporting · Margaret avatar (public/margaret.png) = final beat
- sfx: none

Adapt (logo-assemble-lockup): keep "the mark comes to exist by drawing itself" — the mark is the patient path — resolving into a title lockup.
Scene 1 (0.0–3.3s): `night` ground. The dashed wavy line draws left to right across the upper half (`svg-path-draw`, 0.2–3.0s); each circle scales up from 0.6 with a smooth power3 settle as the line reaches it, icon inside; the seventh arrives orange with the star. "Care-Integrated Clinical Trials" reveals word by word in cream `h1` on "care-integrated" (1.02s), "clinical" (2.09s), "trials" (2.48s).
Scene 2 (3.3–6.9s): under the title, "Treatment through your own doctor." reveals on "treatment" (3.41s); "Every result published." reveals on "every result" (5.04s) with a small check mark, slightly bolder.
Scene 3 (6.9–8.7s): on "Here's Margaret's year" (6.96s) Margaret's avatar settles onto the first circle and that circle gains a soft purple glow ring (one bounded fade-up); the other six dim slightly. Hold.

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

## Frame 7 — Doctor and consent

- scene: A video-visit illustration (doctor on a laptop, Margaret inset); a "not required" list strikes through item by item; a consent form ticks off its plain-language items
- voiceover: "Her own doctor recommends one over a video visit. She doesn't have to be dying or fail approved drugs first. She signs a plain-language consent: the risks, the unknowns, who pays, and that it's experimental."
- duration: 13.357s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/07-doctor-consent.html
- type: feature_showcase
- persuasion: Contrast (required vs not required) + numbered enumeration
- beat: Relief + trust
- blueprint: grid-card-assemble

narrativeRole: Steps 2 and 3: shows how low the bar is (her own doctor, no terminal diagnosis) and how informed the choice is.
keyMessage: Her own doctor can recommend it, she doesn't have to be dying, and she consents in writing knowing the risks.

Copy (from the deck): Required: "Her doctor's recommendation", "Written consent (e-sign is fine)", "Telemedicine is fine". Not required: "Terminal illness", "Trying approved drugs first", "Trial ineligibility". Consent items: "Known risks", "What's unknown", "Who pays", "Clearly experimental".

- focal: the video-visit illustration, then the consent checklist
- roles: eyebrow "STEPS 2–3 · DOCTOR AND CONSENT" + mini patient path (dots 2–3 active) = chrome, top-left · video-visit illustration (public/deck/video-visit.svg) = foreground subject, left ~40% · "Not required" card = supporting, right · consent-form card = supporting, replaces the "Not required" card · "Telemedicine is fine" pill = supporting
- sfx: none

Adapt (grid-card-assemble): keep items arriving in a staggered stack that resolves and holds; here the stacks are a "not required" list and a consent checklist that tick on cue.
Scene 1 (0.0–3.1s): cream ground. Eyebrow and mini path reveal; the video-visit illustration rises in on the left on "Her own doctor" (0.34–0.7s); on "video visit" (2.0s) a pill "Telemedicine is fine" pops beneath it.
Scene 2 (3.1–6.6s): a tinted card titled "Not required" builds on the right, one row per cue, each struck through as it lands: "Terminal illness" on "dying" (3.92s), "Trying approved drugs first" on "approved drugs" (4.86s), "Trial ineligibility" (~5.6s).
Scene 3 (6.6–13.4s): on "She signs" (6.61s) the "Not required" card slides out left and a "Consent form" card (book icon, "Plain language · e-signed") takes its place; checklist rows tick on their cues: "Known risks" (9.04s), "What's unknown" (9.86s), "Who pays" (10.79s), "Clearly experimental" (12.12s). Hold.

## Frame 8 — Payment

- scene: "21" (drugs used under right-to-try) shrinks away as clinic pins spread across a simple map; "$0 required from any insurer"; a charity chip pays Margaret's bill
- voiceover: "Clinics can charge a fair price, so they actually offer it. A charity helps Margaret pay. No insurer has to."
- duration: 7.427s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/08-payment.html
- type: feature_showcase
- persuasion: Before/after + causal chain (fair price → clinics offer it)
- beat: Momentum
- blueprint: compose

narrativeRole: Step 4: explains why clinics will actually offer treatment and who pays.
keyMessage: Fair pricing gets clinics to offer treatment; patients, families or charities pay, and no insurer is required to.

Copy (from the deck): "Right-to-try today: 21 drugs used, 2018–2024. Makers may charge only their costs." · "$0 required from any insurer or state program" · "Patients, families, charities, employers or research sponsors pay."

- focal: the switch from "21 drugs" to clinic pins spreading across a map
- roles: eyebrow "STEP 4 · PAYMENT" + mini path (dot 4 active) = chrome · grey "Right-to-try today" card with "21" = supporting, left · purple "Care-integrated trials" card = supporting, left · stylized map field (simple rounded region with a faint dot grid, no real geography) with clinic pins = hero, right · "$0" statement + charity chip = foreground, final beat
- sfx: none

Compose: a before/after card pair, then a pin field that fills, then a payoff statement.
Scene 1 (0.0–2.1s): cream ground. Eyebrow and mini path reveal. A grey card "Right-to-try today · 21 drugs used, 2018–2024 · makers may charge only their costs" is on screen at 0.34s at reduced opacity; on "fair price" (1.28s) a purple-tinted card "Care-integrated trials · clinics can charge a fair price" slides in on top of it.
Scene 2 (2.1–3.6s): on "so they actually offer it" (2.13–2.94s) clinic pins pop onto the map field in a fast index-ordered cascade (about 24 pins), each settling smoothly.
Scene 3 (3.6–7.4s): on "A charity helps Margaret pay" (3.63–4.86s) a small bill card "Margaret's treatment" appears with a chip "Paid with charity help" (heart icon); on "No insurer has to" (5.72s) the statement "$0 required from any insurer or state program" lands large with "$0" in purple. Hold.

## Frame 9 — Treatment and safety

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

## Frame 10 — Results and the loop

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

## Frame 11 — Scale

- scene: Margaret's single dot multiplies into a field; 2% of it lights up; a short orange bar "36 years" against a long grey bar "443 years"; then "$9.50 per healthy year" against $89 bed nets and $100,000+ new drugs
- voiceover: "Scale that up. If just 2% of willing patients joined, our model says every disease without a treatment could get its first one in about 36 years instead of 443, at roughly $9.50 per year of healthy life."
- duration: 16.103s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/11-scale.html
- type: social_proof
- persuasion: Callback (the 443 from the open) + statistical proof + comparison
- beat: Awe + hope
- blueprint: dataviz-countup

narrativeRole: Pays off the cold open: the same mechanism at scale turns centuries into a lifetime, cheaply.
keyMessage: If even a small share of willing patients could join, every disease could get a treatment within our lifetime.

Copy and sources: "2% of willing patients" · "443 years → 36 years" · "$9.50 per healthy year vs $89 (bed nets) and $100,000+ (typical new drug)". Model figures carry "Model estimate · How to End War and Disease".

- focal: the short 36-year bar against the long 443-year bar
- roles: cream ground = background · dot field of ~600 small dots = hero in Scenes 1–2 · the 36/443 bar pair = hero in Scene 3 · cost strip ($9.50 vs $89 vs $100,000+) = foreground in Scene 4 · "Model estimate · How to End War and Disease" and the cost sources = chrome
- sfx: none

Adapt (dataviz-countup): numbers carry the shot; instruments replace each other on their cues with no camera move. This scene replaces an earlier version that also showed "79%" and "12×"; those beats are gone because the narration no longer says them.
Scene 1 (0.0–1.6s): a single purple dot at center multiplies outward into a field of ~600 small dots on "Scale that up" (0.30–0.85s), index-ordered stagger.
Scene 2 (1.6–4.1s): on "2%" (1.96s) the field dims except a small lit share (2% of the dots, brighter purple); the label "2% of willing patients" appears on "willing patients" (2.77s).
Scene 3 (4.1–11.4s): the field clears on "our model says" (4.10s). A heading "Years until every disease has a first treatment" appears on "every disease" (4.99s). On "36" (8.28s) a short `highlight` orange bar grows labeled "36 years · with care-integrated trials"; on "443" (9.90s) a long grey bar appears beneath it labeled "443 years · today's pace". "Model estimate · How to End War and Disease" fades in under the bars.
Scene 4 (11.4–16.1s): the bars clear; on "$9.50" (11.88s) "$9.50 per healthy year" lands large in purple; on "per year of healthy life" (13.51s) two smaller comparisons appear beside it: "$89 · malaria bed nets" and "$100,000+ · typical new drug"; the footnote "Model estimates · How to End War and Disease, impact paper; ICER" fades in. Hold.

## Frame 12 — Close

- scene: Dark close: the patient path with every dot lit; three short lines (any patient · clinics can offer it · every result published); Margaret and a next-patient silhouette joined by an arrow; the end card with the initiative name and acceleratedmedicine.org
- voiceover: "Any patient can get treatment. Clinics can afford to offer it. Every result is published. Margaret didn't have to be dying to get treatment, and the next patient learns from her."
- duration: 14.71s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/12-close.html
- type: cta
- persuasion: Distillation (rule of three) + callback to Margaret
- beat: Resolve + inspiration
- blueprint: kinetic-type-beats
- asset_candidates: public/margaret.png — Margaret's illustration for the final callback

narrativeRole: Lands the three fixes and the emotional callback, and leaves the name on screen.
keyMessage: Any patient can get treatment, clinics can offer it, and every result helps the next patient.

End card: "The Care-Integrated Clinical Trials Initiative" with "acceleratedmedicine.org" beneath.

- focal: the three short lines, then the end card
- roles: `night` ground = background · the patient path with every dot lit (star in `highlight`) = supporting, top · "Care-Integrated Clinical Trials" title = foreground type · three short lines with icons = foreground · Margaret avatar (public/margaret.png) and a generic next-patient silhouette joined by an orange arrow = supporting · end card "The Care-Integrated Clinical Trials Initiative" / "acceleratedmedicine.org" = final lockup
- sfx: none

Adapt (kinetic-type-beats): short statements arrive one per beat onto a held lockup. The narration no longer says the name, so the title is on screen from the start.
Scene 1 (0.0–1.2s): `night` ground. The path draws across the top with every dot lit (0.0–1.2s); "Care-Integrated Clinical Trials" fades up in cream at 0.1–0.8s.
Scene 2 (1.2–6.4s): three short lines reveal left-aligned, one per cue, each with a small icon: "Any patient" on "Any patient" (0.30s, so it may overlap Scene 1's end), "Clinics can offer it" on "Clinics" (2.35s), "Every result published" on "Every result" (4.39s); on "published" (5.38s) line 3 glows briefly and settles.
Scene 3 (6.4–10.7s): on "Margaret" (6.53s) her avatar appears at right; on "the next patient" (9.04s) an orange arrow draws from her to a generic avatar silhouette.
Scene 4 (10.7–14.7s): the lines and avatars fade back to 35%, and the end card settles: "The Care-Integrated Clinical Trials Initiative" with "acceleratedmedicine.org" beneath. Hold; a gentle fade-out over the last 0.6s is allowed because this is the final frame.

