"""Point every composition at the vendored GSAP instead of the CDN.

The HyperFrames generators (assemble-index, captions build) write a jsDelivr <script> tag for
GSAP. A render that depends on the network fails offline or when the CDN is down, so after
those steps this script swaps each tag for assets/vendor/gsap.min.js.

Usage (from the project root, after captions build, assemble-index and transitions inject):
    python tools/use-local-gsap.py [--check]
--check changes nothing and exits 1 if any composition still loads GSAP from the network.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = "assets/vendor/gsap.min.js"
LOCAL = f'<script src="{SRC}"></script>'
CDN = re.compile(r'<script src="https://cdn\.jsdelivr\.net/npm/gsap@[^"]*"[^>]*></script>')
check_only = "--check" in sys.argv[1:]

files = [ROOT / "index.html", ROOT / ".hyperframes/caption-skin.html",
         *sorted((ROOT / "compositions").rglob("*.html"))]
remote = []
for path in files:
    html = path.read_text(encoding="utf8")
    count = len(CDN.findall(html))
    if not count:
        continue
    rel = path.relative_to(ROOT).as_posix()
    if check_only:
        remote.append(rel)
    else:
        path.write_text(CDN.sub(LOCAL, html), encoding="utf8")
        print(f"{rel}: {count} GSAP tag(s) now load {SRC}")

if remote:
    print("Still loading GSAP from the CDN (run tools/use-local-gsap.py):\n  " + "\n  ".join(remote))
    sys.exit(1)
if check_only:
    print("Every composition loads the vendored GSAP.")
