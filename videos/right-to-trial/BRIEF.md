---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "Right to Trial lets patients who aren't dying try promising treatments through their own doctor, and every result helps the next patient choose better."
destination: youtube-and-x
aspect: 1920x1080
language: en
audience: "General public, patients and families, policymakers and funders following the dFDA / Right to Trial effort"
length: "~70s for this first cut (scenes 1-6 of a ~2:30 explainer)"
angle: story
narration: yes
vo_mode: verbatim
voice: am_michael (Kokoro, placeholder)
---

## Intent

A video version of the "Right to Trial: The Patient Journey" deck, told through Margaret, a
composite 68-year-old Alzheimer's patient. This run builds only the opening ~70 seconds: the hook,
the three problems, the untested gap, the turn to Right to Trial, and Step 1 (comparing options with
real footage of the prototype's Alzheimer's rankings and Lecanemab outcome label, then the
independent review board). The goal is to judge the look before building the rest.

Tone: calm, credible, human. Closer to a policy explainer than an ad. Data-heavy beats should feel
precise, not hyped.

## Assets

- public/margaret.png — the deck's Margaret illustration (440px); she appears in the hook and as a small companion avatar later.
- public/app/rankings-alzheimers.png — full-page 2x capture of /treatment-rankings?condition=alzheimers-disease (2880x4182; CSS-px layout: ranking cards start at y=680, Donanemab card x 208-710, Lecanemab card x 730-1232).
- public/app/label-lecanemab.png — full-page 2x capture of /outcome-labels/demo/alzheimers-disease/lecanemab (2880x3676; CSS-px layout: scores card y 530-690, benefits y 725+, cost card x 850-1232 y 725-1080, side effects y 1440-1610).

## Customizations

- On-screen disclosures, because a video loses the deck's footnotes: "Margaret is a composite patient" in the hook; "Prototype · model estimates" on all app footage; small source lines on statistic beats.
- Visual continuity with the deck: the seven-step wavy path (purple dots, orange final star) introduces the journey and anchors each step as an eyebrow.
- App footage is shown inside a floating browser window with a cursor, not as a raw screen recording.

## Notes

- Placeholder voice only (local Kokoro, signed out of HeyGen). The final will use the user's recorded voice or a clone, so timings will be re-synced.
- No music bed in this cut (local MusicGen is not installed); add one for the final.
- Never invent figures. Every number comes from the deck: 573, 21 (2018-2024), 99.8%, 9,500 x 1,000 = 9.5 million, 0.34%, 2,000+ years; app numbers come from the captured pages.
- Full script (scenes 7-11) is in user_script.txt for later runs.
