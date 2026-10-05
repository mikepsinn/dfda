"""Estimate word timings for narration lines that have not been recorded yet.

Fits the recorded voice's pace from audio_meta.json (time per word from its spoken length, and the
pause after commas, colons and full stops), then writes timings for new lines in the same shape, so
scenes can be built and captioned before the narration exists. When the real narration is recorded,
tools/retime-to-narration.py maps the scenes onto it.

Usage (from the project root):
    python tools/estimate-narration.py fit           # report the fit against the recorded lines
    python tools/estimate-narration.py lines.json    # lines.json: [{"frame": 1, "text": "..."}]; prints voices JSON
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPOKEN = {"68": "sixty eight", "573": "five hundred seventy three", "2020": "twenty twenty", "21": "twenty one",
          "acceleratedmedicine.org": "accelerated medicine dot org", "COVID": "co vid"}


def spoken_letters(word):
    bare = re.sub(r"[^\w.']", "", word).strip(".")
    return len(re.sub(r"[^a-z]", "", SPOKEN.get(bare, bare).lower())) or 1


def pause_kind(word):
    return "stop" if re.search(r"[.!?]$", word) else "colon" if word.endswith(":") \
        else "comma" if word.endswith(",") else "none"


def fit():
    voices = json.loads((ROOT / "audio_meta.json").read_text(encoding="utf8"))["voices"]
    letters = seconds = 0.0
    gaps = {"none": [], "comma": [], "colon": [], "stop": []}
    lead, tail = [], []
    for voice in voices:
        words = voice["words"]
        lead.append(words[0]["start"])
        tail.append(voice["duration_s"] - words[-1]["end"])
        for i, word in enumerate(words):
            letters += spoken_letters(word["text"])
            seconds += word["end"] - word["start"]
            if i + 1 < len(words):
                gaps[pause_kind(word["text"])].append(words[i + 1]["start"] - word["end"])
    mean = lambda xs: sum(xs) / len(xs) if xs else 0.0
    return {"per_letter": seconds / letters, "gap": {k: mean(v) for k, v in gaps.items()},
            "lead": mean(lead), "tail": mean(tail)}


def estimate(text, model):
    t = model["lead"]
    words = []
    tokens = text.split()
    for i, token in enumerate(tokens):
        duration = max(0.12, spoken_letters(token) * model["per_letter"])
        words.append({"id": f"w{i}", "text": token, "start": round(t, 3), "end": round(t + duration, 3)})
        t += duration
        if i + 1 < len(tokens):
            t += model["gap"][pause_kind(token)]
    return words, round(t + model["tail"], 3)


if __name__ == "__main__":
    model = fit()
    if sys.argv[1:] == ["fit"]:
        print(json.dumps(model, indent=2))
        for voice in json.loads((ROOT / "audio_meta.json").read_text(encoding="utf8"))["voices"]:
            text = " ".join(w["text"] for w in voice["words"])
            _, predicted = estimate(text, model)
            print(f"frame {voice['frame']:2}: recorded {voice['duration_s']:6.2f}s, estimated {predicted:6.2f}s")
    else:
        lines = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))
        out = []
        for line in lines:
            words, duration = estimate(line["text"], model)
            out.append({"frame": line["frame"], "duration_s": duration, "words": words, "estimated": True})
        print(json.dumps(out, indent=1))
