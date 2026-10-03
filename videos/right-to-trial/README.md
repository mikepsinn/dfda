# Care-Integrated Clinical Trials: Margaret's year (explainer video)

A 2:24 explainer for the Care-Integrated Clinical Trials Initiative, built with
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP rendered to MP4).
It follows Margaret, a composite Alzheimer's patient, through the seven-step patient
journey, using real footage of the web app's treatment rankings and Outcome Label. It has
narration and captions, and no music.

| File | Purpose |
| --- | --- |
| `SCRIPT.md` | Locked narration, one line per scene (voice: HeyGen "Nadine") |
| `STORYBOARD.md` | Scene-by-scene plan: voiceover, timing, shot sequence, sources |
| `BRIEF.md`, `frame.md` | Intent, audience and the visual design system |
| `compositions/frames/*.html` | The 12 scenes; `index.html` assembles them with captions and audio |
| `public/app/*.png` | Captures of the web app used as footage (`tools/capture-app-screens.mjs`) |
| `timing/authored-words.json` | Word timings each scene was built against |
| `tools/retime-to-narration.py` | Re-times scenes to new narration without rebuilding them |
| `user_script.txt` | The full narration, with sources for the scale figures |

Rendered MP4s, snapshots, voice samples and generated audio are not committed
(see `.gitignore`).

## Rebuilding

Requires Node 22+, ffmpeg, and the HyperFrames Claude Code plugin (or `npx hyperframes`).
Narration uses HeyGen text-to-speech (`npx hyperframes auth login`; free plan allows
10 minutes a month). `PR` below is the plugin root.

```bash
# 1. Narration and word timings (writes assets/voice and audio_meta.json)
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/audio.mjs" \
  --script ./SCRIPT.md --storyboard ./STORYBOARD.md --hyperframes . --out ./audio_meta.json \
  --voice 83548de556df48ba8c09c42a57c51d85
# 2. If the narration's pace changed: re-time scenes, then sync durations
python tools/retime-to-narration.py
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/audio.mjs" \
  sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md
# 3. Captions, assembly, transitions, checks, render
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/captions.mjs" \
  build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes . --out ./caption_groups.json
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/assemble-index.mjs" \
  --storyboard ./STORYBOARD.md --hyperframes .
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/transitions.mjs" \
  inject --storyboard ./STORYBOARD.md --hyperframes .
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" check --timeout 60000
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" render --quality high --output renders/video.mp4
```

To swap in a recorded voice (for example your own reading of `SCRIPT.md`), produce one
file per line with word timings in `audio_meta.json`, then run steps 2–3. Scenes whose
spoken words changed must be rebuilt rather than re-timed.

## Accuracy

Every on-screen figure comes from the Right to Trial deck (see `BRIEF.md`), the sources in
`user_script.txt`, or the captured app pages. Model
estimates (36 vs 443 years, $9.50 per healthy year) are labeled "Model estimate"
with their source; illustrative board-report numbers are labeled "Example report";
the Step 1 footage carries "Prototype · example estimates, not medical advice". The
Lecanemab label values were checked against the FDA prescribing information before
capture (see `apps/web/data/optimitron/corrections.json`).
