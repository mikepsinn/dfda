"""Re-time built scenes to a new narration without rebuilding them.

Each scene's animation is one paused GSAP timeline whose reveals were cued to the word timings
in timing/authored-words.json. After new narration is generated (audio_meta.json with word
timings), this script gives every scene whose timings changed a small wrapper timeline that
drives the original one through a piecewise-linear map from new narration time to authored
time, anchored on matching spoken cues (clause starts and numbers). Reveals keep landing on
the same words at the new pace. Scenes whose words changed must be rebuilt instead.

Usage (from the project root, after the audio step):
    python tools/retime-to-narration.py [--check]
Then: audio.mjs sync-durations, assemble-index, transitions inject/verify, check, render.
--check changes nothing and exits 1 if any scene is out of sync with audio_meta.json. It allows
the up-to-a-second longer clip that transitions inject adds for a scene's outgoing transition.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIN_GAP = 0.5  # seconds between anchors in the new narration
MAX_TRANSITION = 1.0  # seconds transitions inject may add to a scene's clip
DURATION = re.compile(r'data-duration="([0-9.]+)"')
BLOCK = re.compile(r"\n  <script>\n    // retime-to-new-voice:.*?</script>\n", re.S)
check_only = "--check" in sys.argv[1:]

authored = json.loads((ROOT / "timing/authored-words.json").read_text(encoding="utf8"))["scenes"]
narration = json.loads((ROOT / "audio_meta.json").read_text(encoding="utf8"))
storyboard = (ROOT / "STORYBOARD.md").read_text(encoding="utf8")
frame_ids = {int(n): re.search(r"compositions/frames/([\w-]+)\.html", body).group(1)
             for n, body in re.findall(r"(?ms)^## Frame (\d+) — (.*?)(?=^## Frame |\Z)", storyboard)}
voices = {frame_ids[v["frame"]]: v for v in narration["voices"]}


def norm(text):
    return re.sub(r"[^a-z0-9]", "", text.lower())


def anchors_for(old_words, new_words):
    anchors = [(0.0, 0.0)]
    for i, (o, n) in enumerate(zip(old_words, new_words)):
        clause_start = i == 0 or re.search(r"[,.:;]$", old_words[i - 1]["text"])
        if (clause_start or re.search(r"\d", o["text"])) and n["start"] - anchors[-1][1] >= MIN_GAP \
                and o["start"] > anchors[-1][0]:
            anchors.append((o["start"], n["start"]))
    end = (old_words[-1]["end"], new_words[-1]["end"])
    if end[0] > anchors[-1][0] and end[1] > anchors[-1][1]:
        anchors.append(end)
    return anchors


def wrapper(frame_id, anchors, duration):
    pairs = ",".join(f"[{o:.3f},{n:.3f}]" for o, n in anchors)
    return f"""
  <script>
    // retime-to-new-voice: drive this scene's original timeline through a map from the
    // new narration's time to the old narration's time, anchored on matching spoken cues.
    (function () {{
      var ID = "{frame_id}";
      var inner = window.__timelines[ID];
      var MAP = [{pairs}]; // [old seconds, new seconds]
      var NEW_DURATION = {duration};
      function toOld(t) {{
        for (var i = 1; i < MAP.length; i++) {{
          if (t <= MAP[i][1]) {{
            var a = MAP[i - 1], b = MAP[i];
            return a[0] + (t - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
          }}
        }}
        var last = MAP[MAP.length - 1];
        return last[0] + (t - last[1]); // after the last cue, real time (holds stay holds)
      }}
      var OLD_END = toOld(NEW_DURATION);
      var outer = gsap.timeline({{ paused: true }});
      outer.fromTo(inner, {{ time: 0 }}, {{
        time: OLD_END, duration: NEW_DURATION,
        ease: function (p) {{ return toOld(p * NEW_DURATION) / OLD_END; }},
      }}, 0);
      window.__timelines[ID] = outer;
    }})();
  </script>
"""


problems = []
for frame_id, scene in authored.items():
    voice = voices.get(frame_id)
    if voice is None:
        problems.append(f"{frame_id}: no narration line for this scene")
        continue
    old_words, new_words = scene["words"], voice["words"]
    if [norm(w["text"]) for w in old_words] != [norm(w["text"]) for w in new_words]:
        problems.append(f"{frame_id}: the spoken words changed; rebuild this scene instead")
        continue
    path = ROOT / "compositions/frames" / f"{frame_id}.html"
    original = path.read_text(encoding="utf8")
    html = BLOCK.sub("", original)
    duration = voice["duration_s"]
    durations = set(DURATION.findall(html))
    if len(durations) != 1:
        problems.append(f"{frame_id}: expected one full-length clip duration, found {sorted(durations)}")
        continue
    html = html.replace(f'data-duration="{durations.pop()}"', f'data-duration="{duration}"')
    same = all(abs(o["start"] - n["start"]) < 0.05 for o, n in zip(old_words, new_words))
    if not same:
        anchors = anchors_for(old_words, new_words)
        idx = html.rstrip().rfind("</template>")
        html = html[:idx] + wrapper(frame_id, anchors, duration) + html[idx:]
    state = "unchanged timing" if same else f"re-timed with {len(anchors)} anchors"
    if check_only:
        clip = float(DURATION.findall(original)[0])
        in_sync = DURATION.sub("", html) == DURATION.sub("", original) \
            and duration <= clip <= duration + MAX_TRANSITION
        if in_sync:
            print(f"{frame_id}: in sync ({state})")
        else:
            problems.append(f"{frame_id}: out of sync with audio_meta.json; run without --check")
    else:
        path.write_text(html, encoding="utf8")
        print(f"{frame_id}: {state}, {duration}s")

if problems:
    print("\n".join(problems))
    sys.exit(1)
