import { readFileSync } from "node:fs";
import { join } from "node:path";

// One slide of a presentation script (content/<deck>/script.md): "## 3. Heading" (or "## B1." for
// a backup slide), then bold-labeled fields. The deck takes each slide's eyebrow, title, speaker
// notes and source line from here; the rest of the on-screen text lives in the slide components.
export type ScriptSlide = {
  key: string;
  heading: string;
  onScreen: string[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  purpose?: string;
  visual?: string;
  notes?: string;
  narration?: string;
  sourceLine?: string;
};

const FIELDS: Record<string, keyof ScriptSlide> = {
  "Purpose": "purpose", "Visual": "visual", "Speaker notes": "notes",
  "Video narration": "narration", "Source line": "sourceLine",
};
// "**Speaker notes:** text" or "**Video narration** (covers slides 11 and 12): text"
const FIELD = /^\*\*(Purpose|Visual|Speaker notes|Video narration|Source line)(?::\*\*|\*\*[^:]*:)\s*(.*)$/;
const plain = (text: string) => text.replace(/\*\*|`/g, "").trim();

export function parseScript(markdown: string): ScriptSlide[] {
  const slides: ScriptSlide[] = [];
  for (const section of markdown.replace(/\r\n/g, "\n").split(/^## /m).slice(1)) {
    const [headingLine, ...lines] = section.split("\n");
    const match = /^(B?\d+)\. (.+)$/.exec(headingLine.trim());
    if (!match) continue; // the brief, open items and other notes
    const slide: ScriptSlide = { key: match[1], heading: match[2], onScreen: [] };
    let field: keyof ScriptSlide | "onScreen" | null = null;
    const text: Partial<Record<keyof ScriptSlide, string[]>> = {};
    for (const line of lines) {
      if (/^#\s|^---$/.test(line)) break; // a top-level heading or rule ends the last slide
      const start = FIELD.exec(line);
      if (start) {
        field = FIELDS[start[1]];
        text[field] = [start[2]];
      } else if (line === "**On screen**") {
        field = "onScreen";
      } else if (field === "onScreen" && line.startsWith("- ")) {
        slide.onScreen.push(line.slice(2));
      } else if (field === "onScreen" && line.startsWith("  ") && slide.onScreen.length) {
        slide.onScreen[slide.onScreen.length - 1] += ` ${line.trim()}`;
      } else if (field && field !== "onScreen" && line.trim()) {
        text[field]!.push(line.trim());
      }
    }
    for (const [key, parts] of Object.entries(text)) {
      (slide as Record<string, unknown>)[key] = plain(parts!.join(" "));
    }
    for (const item of slide.onScreen) {
      const labeled = /^(Eyebrow|Title|Headline|Subtitle): (.+)$/.exec(item);
      if (!labeled) continue;
      if (labeled[1] === "Eyebrow") slide.eyebrow = plain(labeled[2]);
      else if (labeled[1] === "Subtitle") slide.subtitle = plain(labeled[2]);
      else slide.title = plain(labeled[2]);
    }
    slides.push(slide);
  }
  return slides;
}

// Reads at build time; the presentation pages are static.
export function loadScript(deck: string) {
  return parseScript(readFileSync(join(process.cwd(), "content", deck, "script.md"), "utf8"));
}
